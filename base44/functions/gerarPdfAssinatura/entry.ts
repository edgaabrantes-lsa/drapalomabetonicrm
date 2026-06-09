import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assinatura_id } = await req.json();
    if (!assinatura_id) {
      return Response.json({ error: 'assinatura_id é obrigatório' }, { status: 400 });
    }

    // Buscar assinatura
    const assinaturas = await base44.entities.AssinaturaEletronica.filter({ id: assinatura_id }, "-data_assinatura", 1);
    const assinatura = assinaturas[0];

    if (!assinatura) {
      return Response.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    // Criar PDF
    const doc = new jsPDF();
    
    // Cores
    const gold = [200, 169, 106];
    const black = [0, 0, 0];
    const gray = [102, 102, 102];

    // Cabeçalho
    doc.setFillColor(...gold);
    doc.rect(0, 0, 210, 10, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE ASSINATURA ELETRÔNICA', 105, 7, { align: 'center' });

    // Dados do documento
    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');
    
    let y = 25;
    const lineHeight = 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.documento_nome, 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Tipo:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.documento_tipo, 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Versão:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.documento_versao, 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Hash:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFont('courier', 'normal');
    doc.text(assinatura.documento_hash, 60, y);
    y += lineHeight;

    // Separador
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Dados do assinante
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text('DADOS DO ASSINANTE', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');

    doc.setFont('helvetica', 'bold');
    doc.text('Nome:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.assinante_nome, 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.assinante_cpf, 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Tipo:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.assinante_tipo === 'paciente' ? 'Paciente' : `Responsável Legal (${assinatura.responsavel_parentesco})`, 60, y);
    y += lineHeight;

    // Separador
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Dados da assinatura
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text('REGISTRO DA ASSINATURA', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');

    doc.setFont('helvetica', 'bold');
    doc.text('Data:', 20, y);
    doc.setFont('helvetica', 'normal');
    const dataAssinatura = new Date(assinatura.data_assinatura);
    doc.text(dataAssinatura.toLocaleDateString('pt-BR'), 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Hora:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dataAssinatura.toLocaleTimeString('pt-BR'), 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Declarou leitura:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.declarou_leitura ? 'Sim' : 'Não', 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Concordou termos:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.concordou_termos ? 'Sim' : 'Não', 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Dispositivo:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFont('courier', 'normal');
    doc.text(assinatura.dispositivo?.substring(0, 80) || 'N/A', 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('IP:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.ip_address || 'N/A', 60, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Responsável (Admin):', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(assinatura.usuario_responsavel_nome || 'N/A', 60, y);
    y += 15;

    // Imagem da assinatura
    if (assinatura.assinatura_data_url) {
      try {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...gold);
        doc.text('ASSINATURA MANUSCRITA', 20, y);
        y += 5;
        
        // Baixar imagem da URL e converter para base64
        const imgResponse = await fetch(assinatura.assinatura_data_url);
        const imgBlob = await imgResponse.blob();
        const imgArrayBuffer = await imgBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imgArrayBuffer)));
        const imgData = `data:image/png;base64,${base64}`;
        
        doc.addImage(imgData, 'PNG', 20, y, 80, 30);
        y += 35;
      } catch (e) {
        console.error("Erro ao adicionar imagem:", e.message);
        doc.setTextColor(...gray);
        doc.setFont('helvetica', 'italic');
        doc.text('Imagem da assinatura não disponível', 20, y);
        y += 10;
      }
    }

    // Rodapé
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'italic');
    doc.text('Este documento é um comprovante eletrônico de assinatura.', 105, y, { align: 'center' });
    y += 5;
    doc.text('A validade jurídica é garantida pela Lei nº 14.063/2020 e normas do ICP-Brasil.', 105, y, { align: 'center' });
    y += 5;
    doc.text(`Hash de verificação: ${assinatura.documento_hash}`, 105, y, { align: 'center' });

    // Retornar PDF como ArrayBuffer
    const pdfBytes = doc.output('arraybuffer');
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Comprovante_Assinatura_${assinatura.documento_nome}.pdf"`
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});