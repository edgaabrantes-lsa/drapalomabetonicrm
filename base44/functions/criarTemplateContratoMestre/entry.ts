import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONTRATO_MESTRE_CONTEUDO = `CONTRATO MESTRE DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS E PROCEDIMENTOS CLÍNICOS

Pelo presente instrumento particular, de um lado:

CONTRATANTE/PACIENTE:
Nome: {{patient.full_name}}
CPF: {{patient.document_number}}
RG: {{patient.rg}}
Data de nascimento: {{patient.birth_date}}
Telefone/WhatsApp: {{patient.phone}}
E-mail: {{patient.email}}
Endereço: {{patient.address}}

E, de outro lado:

CONTRATADA/CLÍNICA:
Nome: {{clinic.clinic_name}}
Razão social: {{clinic.legal_name}}
CNPJ/CPF: {{clinic.cnpj}}
Endereço: {{clinic.address}}
Responsável técnica/profissional: {{clinic.professional_name}}
Registro profissional: {{clinic.professional_registry}}

As partes resolvem celebrar o presente Contrato Mestre de Prestação de Serviços Estéticos e Procedimentos Clínicos, mediante as cláusulas abaixo:

CLÁUSULA 1 — OBJETO

O presente contrato tem por objeto a prestação de serviços estéticos, clínicos, faciais, corporais, dermatofuncionais ou de harmonização, conforme procedimento selecionado no Dossiê da Paciente e nos documentos complementares vinculados.

Procedimento/Protocolo contratado:
{{procedure.name}}

Profissional responsável:
{{procedure.professional_name}}

CLÁUSULA 2 — NATUREZA DO SERVIÇO

A paciente declara estar ciente de que procedimentos estéticos e clínicos possuem resultados individuais, variáveis e dependentes de fatores biológicos, anatômicos, comportamentais, metabólicos, de estilo de vida, adesão às orientações e resposta do organismo.

A contratada compromete-se a empregar técnica, zelo, conhecimento profissional e recursos adequados, sem promessa de resultado absoluto, definitivo ou idêntico a referências visuais.

CLÁUSULA 3 — AVALIAÇÃO E PRONTUÁRIO

A paciente declara que forneceu informações verdadeiras sobre saúde, histórico clínico, alergias, medicamentos, procedimentos anteriores, contraindicações e demais dados relevantes.

A omissão de informações poderá comprometer a segurança, o resultado e a conduta profissional.

CLÁUSULA 4 — RISCOS E INTERCORRÊNCIAS

A paciente declara ciência de que procedimentos podem apresentar efeitos esperados ou intercorrências, como dor, edema, vermelhidão, hematomas, sensibilidade, assimetrias temporárias, necessidade de revisão, ajustes, reavaliações ou condutas complementares.

Riscos específicos de cada procedimento serão descritos no Termo de Consentimento correspondente.

CLÁUSULA 5 — ORIENTAÇÕES PRÉ E PÓS-PROCEDIMENTO

A paciente compromete-se a seguir todas as orientações fornecidas pela profissional ou equipe clínica antes e após o procedimento.

O descumprimento das orientações poderá interferir no resultado e na segurança do tratamento.

CLÁUSULA 6 — CONDIÇÕES FINANCEIRAS

As condições financeiras constam no Anexo Financeiro vinculado a este contrato, incluindo valor total, entrada, saldo, parcelas, forma de pagamento, vencimentos e eventuais observações comerciais.

CLÁUSULA 7 — CANCELAMENTO, REMARCAÇÃO E REEMBOLSO

As regras de cancelamento, remarcação, retorno, revisão, crédito e eventual reembolso seguirão a política interna da clínica e as condições registradas no Anexo Financeiro.

CLÁUSULA 8 — USO DE IMAGEM E DADOS

A utilização de imagem, fotografia, vídeo, prontuário, dados pessoais e dados sensíveis observará os termos específicos de LGPD e Uso de Imagem assinados pela paciente.

CLÁUSULA 9 — DOCUMENTOS COMPLEMENTARES

Integram este contrato:
- Anexo Financeiro
- Termo LGPD
- Termo de Uso de Imagem, quando aplicável
- Termo de Consentimento do Procedimento
- Prontuário/Avaliação Clínica
- Comprovantes de pagamento
- Assinatura eletrônica ou PDF assinado

CLÁUSULA 10 — ACEITE ELETRÔNICO

A paciente declara que leu, compreendeu e aceitou os termos deste contrato, podendo assinar eletronicamente por meio de assinatura manuscrita em tela, aceite digital, upload de PDF assinado ou plataforma externa.

CLÁUSULA 11 — FORO

Fica eleito o foro da comarca da sede da clínica para dirimir eventuais controvérsias oriundas deste contrato.

Local e data: {{contract.city}}, {{contract.date}}

___________________________
Paciente: {{patient.full_name}}

___________________________
Clínica/Profissional: {{clinic.professional_name}}

--- ASSINATURA ELETRÔNICA ---
Assinado por: {{signature.signer_name}}
CPF: {{signature.signer_cpf}}
Data/Hora: {{signature.signed_at}}
Método: {{signature.method}}
Hash: {{signature.hash}}
Status: {{signature.status}}

Este documento foi gerado automaticamente pela plataforma clínica e vinculado ao Dossiê da Paciente.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    // Verificar se já existe template ativo de contrato_mestre
    const existentes = await base44.asServiceRole.entities.DocumentoTemplate.filter({ tipo: 'contrato_mestre', status: 'ativo' });
    if (existentes && existentes.length > 0) {
      return Response.json({ message: 'Template já existe', template: existentes[0] });
    }

    const template = await base44.asServiceRole.entities.DocumentoTemplate.create({
      nome: 'Contrato Mestre de Prestação de Serviços Estéticos',
      tipo: 'contrato_mestre',
      versao_atual: '1.0',
      conteudo: CONTRATO_MESTRE_CONTEUDO,
      status: 'ativo',
      criado_por: user.full_name || 'Sistema',
      publicado_em: new Date().toISOString(),
    });

    return Response.json({ message: 'Template criado com sucesso', template });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});