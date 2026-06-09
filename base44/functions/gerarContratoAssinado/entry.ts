import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Gera o contrato completo com bloco de assinatura eletrônica embutido
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documento_id, patient_id } = await req.json();

    if (!documento_id || !patient_id) {
      return Response.json({ error: 'documento_id e patient_id são obrigatórios' }, { status: 400 });
    }

    // 1. Buscar documento
    const docs = await base44.entities.DossieDocumento.filter({ id: documento_id }, "-created_date", 1);
    const documento = docs[0];
    if (!documento) {
      return Response.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // 2. Buscar paciente
    const patients = await base44.entities.Patient.filter({ id: patient_id }, "-created_date", 1);
    const patient = patients[0];

    // 3. Buscar assinatura vinculada (mais recente com status assinado)
    const todasAssinaturas = await base44.entities.AssinaturaEletronica.filter(
      { documento_id: documento_id, status: "assinado" },
      "-data_assinatura",
      5
    );
    // Fallback: buscar por patient_id também caso documento_id não encontre
    let assinatura = todasAssinaturas[0];
    if (!assinatura) {
      const porPaciente = await base44.entities.AssinaturaEletronica.filter(
        { patient_id: patient_id, status: "assinado" },
        "-data_assinatura",
        10
      );
      assinatura = porPaciente.find(a => a.documento_id === documento_id) || porPaciente[0];
    }

    // 4. Montar PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const gold = [200, 169, 106];
    const black = [20, 20, 20];
    const gray = [100, 100, 100];
    const darkBg = [13, 17, 25];
    const green = [34, 197, 94];

    // ── CABEÇALHO ──
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLÍNICA DRA. PALOMA BETONI', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('Documento Clínico — Registro Eletrônico Certificado', pageWidth / 2, 20, { align: 'center' });

    // ── TÍTULO DO DOCUMENTO ──
    doc.setFontSize(13);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'bold');
    doc.text(documento.nome || 'Documento Clínico', pageWidth / 2, 42, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const tipoLabel = {
      contrato_mestre: 'Contrato Mestre',
      anexo_financeiro: 'Anexo Financeiro',
      consentimento: 'Termo de Consentimento',
      termo_lgpd: 'Termo LGPD',
      uso_imagem: 'Autorização de Uso de Imagem',
      contrato_assinado: 'Contrato Assinado',
      outro: 'Documento'
    }[documento.tipo] || documento.tipo;
    doc.text(`Tipo: ${tipoLabel}  |  Versão: ${documento.versao || '1.0'}  |  Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 50, { align: 'center' });

    // ── LINHA DOURADA ──
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(15, 55, pageWidth - 15, 55);

    let y = 65;

    // ── DADOS DO PACIENTE ──
    if (patient) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gold);
      doc.text('DADOS DA PACIENTE', 15, y);
      y += 7;

      doc.setFontSize(9);
      doc.setTextColor(...black);
      doc.setFont('helvetica', 'normal');

      const endereco = patient.address
        ? `${patient.address.street || ''}, ${patient.address.number || ''} — ${patient.address.city || ''}`
        : 'Não informado';

      const dadosPaciente = [
        ['Nome', patient.full_name || '—'],
        ['CPF', patient.document_number || '—'],
        ['RG', patient.rg || '—'],
        ['Telefone', patient.phone || '—'],
        ['E-mail', patient.email || '—'],
        ['Endereço', endereco],
      ];

      dadosPaciente.forEach(([label, valor]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 15, y);
        doc.setFont('helvetica', 'normal');
        const linhas = doc.splitTextToSize(valor, pageWidth - 75);
        doc.text(linhas, 55, y);
        y += 7 * linhas.length;
      });
      y += 5;
    }

    // ── OBSERVAÇÕES / CONTEÚDO DO DOCUMENTO ──
    if (documento.observacoes) {
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.3);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gold);
      doc.text('CONTEÚDO / OBSERVAÇÕES', 15, y);
      y += 7;

      doc.setFontSize(9);
      doc.setTextColor(...black);
      doc.setFont('helvetica', 'normal');
      const linhasObs = doc.splitTextToSize(documento.observacoes, pageWidth - 30);
      doc.text(linhasObs, 15, y);
      y += linhasObs.length * 6 + 8;
    }

    // ── PROCEDIMENTO ──
    if (documento.procedimento_vinculado) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text('Procedimento:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(documento.procedimento_vinculado, 55, y);
      y += 10;
    }

    // ── NOVA PÁGINA se necessário para assinatura ──
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 20;
    }

    // ── BLOCO DE ASSINATURA ELETRÔNICA ──
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    // Badge "ASSINADO ELETRONICAMENTE"
    if (assinatura) {
      doc.setFillColor(...green);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const badgeText = '✓  DOCUMENTO ASSINADO ELETRONICAMENTE';
      const badgeW = doc.getTextWidth(badgeText) + 16;
      doc.roundedRect(15, y - 4, badgeW, 10, 2, 2, 'F');
      doc.text(badgeText, 15 + badgeW / 2, y + 2.5, { align: 'center' });
      y += 16;
    } else {
      doc.setTextColor(200, 100, 50);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠  ASSINATURA PENDENTE', 15, y);
      y += 12;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text('ASSINATURA ELETRÔNICA', 15, y);
    y += 7;

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Este documento foi assinado eletronicamente, nos termos da Lei nº 14.063/2020 e MP 2.200-2/2001.',
      15, y
    );
    y += 10;

    if (assinatura) {
      // Dados textuais da assinatura (camada Authentic/DocuSign)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);

      const dataAssinatura = assinatura.data_assinatura
        ? new Date(assinatura.data_assinatura)
        : new Date();
      const dataFmt = dataAssinatura.toLocaleDateString('pt-BR');
      const horaFmt = dataAssinatura.toLocaleTimeString('pt-BR');

      const linhaAuth = doc.splitTextToSize(
        `Assinado eletronicamente por ${assinatura.assinante_nome || '—'}, CPF ${assinatura.assinante_cpf || '—'}, em ${dataFmt} às ${horaFmt}, mediante aceite digital registrado na plataforma Clínica Dra. Paloma Betoni, com identificação técnica vinculada ao documento.`,
        pageWidth - 30
      );
      doc.text(linhaAuth, 15, y);
      y += linhaAuth.length * 6 + 8;

      // Grade de dados
      const campos = [
        ['Nome do Assinante', assinatura.assinante_nome || '—'],
        ['CPF', assinatura.assinante_cpf || '—'],
        ['Tipo', assinatura.assinante_tipo === 'responsavel_legal'
          ? `Responsável Legal${assinatura.responsavel_parentesco ? ' — ' + assinatura.responsavel_parentesco : ''}`
          : 'Paciente'],
        ['Data da Assinatura', dataFmt],
        ['Hora', horaFmt],
        ['Identificador (Hash)', assinatura.documento_hash || '—'],
        ['Responsável Admin', assinatura.usuario_responsavel_nome || '—'],
        ['IP / Dispositivo', (assinatura.ip_address || '—') + ' | ' + (assinatura.dispositivo ? assinatura.dispositivo.substring(0, 60) + '...' : '—')],
        ['Declarou Leitura', assinatura.declarou_leitura ? 'Sim' : 'Não'],
        ['Concordou com os Termos', assinatura.concordou_termos ? 'Sim' : 'Não'],
        ['Método', 'Assinatura Digital Presencial (Canvas)'],
        ['Status', 'Assinado Eletronicamente'],
      ];

      campos.forEach(([label, valor]) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text(`${label}:`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        const linhas = doc.splitTextToSize(String(valor), pageWidth - 75);
        doc.text(linhas, 65, y);
        y += Math.max(6, linhas.length * 5.5);
      });

      y += 8;

      // ── IMAGEM DA ASSINATURA ──
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...gold);
      doc.text('ASSINATURA MANUSCRITA:', 15, y);
      y += 6;

      if (assinatura.assinatura_data_url) {
        try {
          // Download e conversão para base64
          const imgResponse = await fetch(assinatura.assinatura_data_url);
          const imgBlob = await imgResponse.blob();
          const imgBuffer = await imgBlob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
          const imgData = `data:image/png;base64,${base64}`;

          // Área de assinatura com fundo branco
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(15, y, 120, 40, 2, 2, 'F');
          doc.setDrawColor(...gold);
          doc.setLineWidth(0.5);
          doc.roundedRect(15, y, 120, 40, 2, 2, 'S');
          doc.addImage(imgData, 'PNG', 17, y + 2, 116, 36);
          y += 44;
        } catch (e) {
          console.error('Erro ao carregar imagem da assinatura:', e.message);
          doc.setFillColor(245, 245, 245);
          doc.roundedRect(15, y, 120, 20, 2, 2, 'F');
          doc.setTextColor(...gray);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.text('Assinatura eletrônica registrada — imagem não disponível', 75, y + 11, { align: 'center' });
          y += 24;
        }
      } else {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, y, 120, 20, 2, 2, 'F');
        doc.setTextColor(...gray);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Assinatura eletrônica registrada — imagem não disponível', 75, y + 11, { align: 'center' });
        y += 24;
      }

      // Linha de assinatura
      doc.setDrawColor(...black);
      doc.setLineWidth(0.3);
      doc.line(15, y + 2, 135, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.text(`${assinatura.assinante_nome || '—'} — CPF ${assinatura.assinante_cpf || '—'}`, 15, y + 8);
      y += 16;

    } else {
      // Sem assinatura — campo em branco
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, y, 120, 40, 2, 2, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, 120, 40, 2, 2, 'S');
      y += 44;
      doc.setDrawColor(...black);
      doc.line(15, y, 135, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text('Assinatura da Paciente — Pendente', 15, y + 6);
      y += 14;
    }

    // ── RODAPÉ ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Clínica Dra. Paloma Betoni — Documento gerado em ${new Date().toLocaleString('pt-BR')} — Página ${p}/${totalPages}`,
        pageWidth / 2, pageHeight - 8, { align: 'center' }
      );
      if (assinatura?.documento_hash) {
        doc.text(`Hash: ${assinatura.documento_hash}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
      }
    }

    const pdfBytes = doc.output('arraybuffer');
    const nomeArquivo = `Contrato_${(documento.nome || 'Documento').replace(/\s+/g, '_')}_${assinatura ? 'Assinado' : 'Pendente'}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});