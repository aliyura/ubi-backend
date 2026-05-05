import { BadRequestException, Injectable } from '@nestjs/common';
import { USER_ROLE } from '@prisma/client';
import { format } from 'date-fns';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatementQueryDto, StatementSection } from './dto/statement-query.dto';

@Injectable()
export class StatementService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCsv(query: StatementQueryDto, user: any): Promise<Buffer> {
    this.validateDateRange(query.startDate, query.endDate);
    const data = await this.fetchStatementData(query, user);
    const csv = this.buildCsvContent(data, query, user);
    return Buffer.from('\uFEFF' + csv, 'utf-8');
  }

  async generatePdf(query: StatementQueryDto, user: any): Promise<Buffer> {
    this.validateDateRange(query.startDate, query.endDate);
    const data = await this.fetchStatementData(query, user);
    return this.buildPdfContent(data, query, user);
  }

  private validateDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 366) {
      throw new BadRequestException('Date range cannot exceed 366 days');
    }
  }

  private async fetchStatementData(query: StatementQueryDto, user: any) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const section = query.section ?? StatementSection.ALL;
    const isAgent = user.role === USER_ROLE.AGENT;

    let transactions: any[] = [];
    let loans: any[] = [];
    let repayments: any[] = [];
    let wallet: any = null;

    if (section === StatementSection.ALL || section === StatementSection.TRANSACTIONS) {
      wallet = await this.prisma.wallet.findFirst({ where: { userId: user.id } });
      if (wallet) {
        transactions = await this.prisma.transaction.findMany({
          where: {
            walletId: wallet.id,
            createdAt: { gte: startDate, lte: endDate },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (section === StatementSection.ALL || section === StatementSection.LOANS) {
      loans = await this.prisma.loanApplication.findMany({
        where: isAgent
          ? { agentId: user.id, createdAt: { gte: startDate, lte: endDate } }
          : { userId: user.id, createdAt: { gte: startDate, lte: endDate } },
        orderBy: { createdAt: 'desc' },
        select: {
          applicationRef: true,
          status: true,
          purpose: true,
          totalEstimatedValue: true,
          currency: true,
          submittedAt: true,
          createdAt: true,
        },
      });
    }

    if (!isAgent && (section === StatementSection.ALL || section === StatementSection.REPAYMENTS)) {
      repayments = await this.prisma.repayment.findMany({
        where: {
          plan: { application: { userId: user.id } },
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          plan: {
            select: { application: { select: { applicationRef: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return { transactions, loans, repayments, wallet };
  }

  // ── CSV ────────────────────────────────────────────────────────────────────

  private buildCsvContent(data: any, query: StatementQueryDto, user: any): string {
    const { transactions, loans, repayments, wallet } = data;
    const lines: string[] = [];

    lines.push('Account Statement');
    lines.push(`Name,${this.csvEscape(user.fullname)}`);
    lines.push(`Username,${this.csvEscape(user.username)}`);
    if (wallet?.accountNumber) lines.push(`Account Number,${wallet.accountNumber}`);
    lines.push(`Statement Period,${query.startDate} to ${query.endDate}`);
    lines.push(`Generated On,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    lines.push('');

    if (transactions.length > 0) {
      lines.push('WALLET TRANSACTIONS');
      lines.push('Date,Reference,Type,Category,Description,Amount,Currency,Previous Balance,Current Balance,Status');
      for (const t of transactions) {
        const amount = Math.abs(t.currentBalance - t.previousBalance).toFixed(2);
        lines.push(
          [
            format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
            this.csvEscape(t.transactionRef || t.reference || ''),
            t.type,
            t.category,
            this.csvEscape(t.description || ''),
            t.type === 'DEBIT' ? `-${amount}` : `+${amount}`,
            t.currency,
            t.previousBalance.toFixed(2),
            t.currentBalance.toFixed(2),
            t.status,
          ].join(','),
        );
      }
      lines.push('');
    }

    if (loans.length > 0) {
      lines.push('LOAN APPLICATIONS');
      lines.push('Date,Reference,Purpose,Status,Total Value,Currency,Submitted At');
      for (const l of loans) {
        lines.push(
          [
            format(new Date(l.createdAt), 'yyyy-MM-dd'),
            l.applicationRef,
            this.csvEscape(l.purpose || ''),
            l.status,
            l.totalEstimatedValue.toFixed(2),
            l.currency,
            l.submittedAt ? format(new Date(l.submittedAt), 'yyyy-MM-dd') : '',
          ].join(','),
        );
      }
      lines.push('');
    }

    if (repayments.length > 0) {
      lines.push('REPAYMENT HISTORY');
      lines.push('Date,Loan Reference,Installment #,Due Date,Amount Due,Amount Paid,Status,Reference');
      for (const r of repayments) {
        lines.push(
          [
            format(new Date(r.createdAt), 'yyyy-MM-dd'),
            r.plan.application.applicationRef,
            r.installmentNumber,
            format(new Date(r.dueDate), 'yyyy-MM-dd'),
            r.amount.toFixed(2),
            r.amountPaid.toFixed(2),
            r.status,
            this.csvEscape(r.reference || ''),
          ].join(','),
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  private buildPdfContent(data: any, query: StatementQueryDto, user: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderPdfBody(doc, data, query, user);
      doc.end();
    });
  }

  private renderPdfBody(doc: any, data: any, query: StatementQueryDto, user: any) {
    const { transactions, loans, repayments, wallet } = data;
    const currency = wallet?.currency || 'NGN';

    // Title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('ACCOUNT STATEMENT', { align: 'center' });
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#888888')
      .text(`Generated: ${format(new Date(), 'MMMM dd, yyyy  HH:mm')}`, { align: 'center' });
    doc.fillColor('#000000').moveDown(0.8);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    // Account info
    doc.fontSize(9).font('Helvetica');
    doc.text(`Name:     ${user.fullname}`);
    doc.text(`Username: @${user.username}`);
    if (wallet?.accountNumber) doc.text(`Account:  ${wallet.accountNumber}`);
    doc.text(`Period:   ${query.startDate}  –  ${query.endDate}`);
    doc.moveDown(0.8);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    // Summary
    if (transactions.length > 0) {
      const successTx = transactions.filter((t: any) => t.status === 'success');
      const totalCredits = successTx
        .filter((t: any) => t.type === 'CREDIT')
        .reduce((s: number, t: any) => s + Math.abs(t.currentBalance - t.previousBalance), 0);
      const totalDebits = successTx
        .filter((t: any) => t.type === 'DEBIT')
        .reduce((s: number, t: any) => s + Math.abs(t.currentBalance - t.previousBalance), 0);

      doc.fontSize(10).font('Helvetica-Bold').text('Transaction Summary');
      doc.fontSize(9).font('Helvetica');
      doc.text(`  Credits:       ${currency} ${totalCredits.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      doc.text(`  Debits:        ${currency} ${totalDebits.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      doc.text(`  Transactions:  ${transactions.length}`);
      doc.moveDown(0.8);
    }

    // Transactions table
    if (transactions.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Wallet Transactions');
      doc.moveDown(0.3);

      const txRows = transactions.map((t: any) => {
        const amt = Math.abs(t.currentBalance - t.previousBalance).toFixed(2);
        return [
          format(new Date(t.createdAt), 'dd MMM yy HH:mm'),
          t.type,
          t.category,
          (t.description || '').substring(0, 24),
          `${t.type === 'DEBIT' ? '-' : '+'}${t.currency} ${amt}`,
          t.status,
        ];
      });

      const txEndY = this.drawPdfTable(
        doc,
        50,
        doc.y,
        [
          { label: 'Date', width: 90 },
          { label: 'Type', width: 50 },
          { label: 'Category', width: 85 },
          { label: 'Description', width: 120 },
          { label: 'Amount', width: 95 },
          { label: 'Status', width: 55 },
        ],
        txRows,
      );
      doc.y = txEndY + 15;
    }

    // Loan applications
    if (loans.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Loan Applications', 50, doc.y);
      doc.moveDown(0.3);

      const loanRows = loans.map((l: any) => [
        format(new Date(l.createdAt), 'dd MMM yyyy'),
        l.applicationRef,
        (l.purpose || 'N/A').substring(0, 20),
        `${l.currency} ${l.totalEstimatedValue.toFixed(2)}`,
        l.status,
      ]);

      const loanEndY = this.drawPdfTable(
        doc,
        50,
        doc.y,
        [
          { label: 'Date', width: 80 },
          { label: 'Reference', width: 135 },
          { label: 'Purpose', width: 120 },
          { label: 'Value', width: 90 },
          { label: 'Status', width: 70 },
        ],
        loanRows,
      );
      doc.y = loanEndY + 15;
    }

    // Repayments
    if (repayments.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Repayment History', 50, doc.y);
      doc.moveDown(0.3);

      const repRows = repayments.map((r: any) => [
        format(new Date(r.dueDate), 'dd MMM yyyy'),
        r.plan.application.applicationRef,
        `#${r.installmentNumber}`,
        r.amount.toFixed(2),
        r.amountPaid.toFixed(2),
        r.status,
      ]);

      this.drawPdfTable(
        doc,
        50,
        doc.y,
        [
          { label: 'Due Date', width: 80 },
          { label: 'Loan Reference', width: 135 },
          { label: 'Install.', width: 50 },
          { label: 'Amount', width: 85 },
          { label: 'Paid', width: 85 },
          { label: 'Status', width: 60 },
        ],
        repRows,
      );
    }

    // Footer
    doc
      .fontSize(7)
      .fillColor('#aaaaaa')
      .text(
        'This document is computer-generated and does not require a signature.',
        50,
        doc.page.height - 40,
        { align: 'center', width: 495 },
      );
  }

  private drawPdfTable(
    doc: any,
    x: number,
    startY: number,
    cols: { label: string; width: number }[],
    rows: string[][],
  ): number {
    const totalW = cols.reduce((s, c) => s + c.width, 0);
    const headerH = 18;
    const rowH = 15;

    // Header row
    doc.rect(x, startY, totalW, headerH).fill('#2d5016');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    let cx = x;
    for (const col of cols) {
      doc.text(col.label, cx + 3, startY + 5, { width: col.width - 6, ellipsis: true });
      cx += col.width;
    }

    // Data rows
    let rowY = startY + headerH;
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000');

    for (let i = 0; i < rows.length; i++) {
      if (rowY > doc.page.height - 70) {
        doc.addPage();
        rowY = 50;
      }
      if (i % 2 === 0) {
        doc.rect(x, rowY, totalW, rowH).fill('#f7f7f7');
        doc.fillColor('#000000');
      }
      cx = x;
      for (let j = 0; j < cols.length; j++) {
        doc.text(rows[i][j] || '', cx + 3, rowY + 3, { width: cols[j].width - 6, ellipsis: true });
        cx += cols[j].width;
      }
      rowY += rowH;
    }

    return rowY;
  }
}
