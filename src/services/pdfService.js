const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const pdfService = {
    generate({ list, presences }) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Lista de Presença - ${list.title}`,
                        Author: 'SGP - Sistema de Gerenciamento de Presença',
                        Subject: `${list.type === 'reuniao' ? 'Reunião' : 'Treinamento'} - ${list.title}`
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Logo centralizada
                const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'uni_logo.png');
                if (fs.existsSync(logoPath)) {
                    // Centralizar imagem (Página A4 tem 595 pontos de largura)
                    const logoWidth = 150;
                    const xPos = (595 - logoWidth) / 2;
                    doc.image(logoPath, xPos, 30, { width: logoWidth });
                    doc.moveDown(4);
                } else {
                    // Caso a logo não exista, mantém um espaçamento
                    doc.moveDown(2);
                }

                // Título
                doc.fontSize(18)
                   .fillColor('#003D5B')
                   .text('Lista de Presença', { align: 'center' });
                
                doc.moveDown(0.5);

                // Informações da lista
                const tipoLabel = list.type === 'reuniao' ? 'Reunião' : 'Treinamento';
                const eventDate = new Date(list.event_date + 'T12:00:00');
                const dateFormatted = eventDate.toLocaleDateString('pt-BR');

                doc.fontSize(11).fillColor('#333333');

                // Fuso horário de Brasília
                const tz = 'America/Sao_Paulo';
                const now = new Date();
                const dateOptions = { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' };
                const timeOptions = { timeZone: tz, hour: '2-digit', minute: '2-digit' };

                // Linha 1: Título e Criador (Agrupados para quebra inteligente)
                doc.font('Helvetica-Bold').text('Título: ', 50, doc.y, { continued: true })
                   .font('Helvetica').text(list.title, { continued: true })
                   .font('Helvetica-Bold').text('   |   Criado por: ', { continued: true })
                   .font('Helvetica').text(list.creator_name || 'N/A');

                doc.moveDown(0.3);

                // Linha 2: Tipo | Data | Código
                doc.font('Helvetica-Bold').text('Tipo: ', 50, doc.y, { continued: true })
                   .font('Helvetica').text(tipoLabel, { continued: true })
                   .font('Helvetica-Bold').text('   |   Data: ', { continued: true })
                   .font('Helvetica').text(dateFormatted, { continued: true })
                   .font('Helvetica-Bold').text('   |   Código: ', { continued: true })
                   .font('Helvetica').text(list.code);
                
                doc.moveDown(1);

                // Linha separadora
                doc.moveTo(50, doc.y)
                   .lineTo(545, doc.y)
                   .strokeColor('#00A0D2')
                   .lineWidth(2)
                   .stroke();

                doc.moveDown(0.5);

                // Tabela de presenças - Cabeçalho alinhado
                const tableHeaderY = doc.y;
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .fillColor('#003D5B');

                doc.text('Nº', 50, tableHeaderY, { width: 30 })
                   .text('Nome Completo', 85, tableHeaderY, { width: 180 })
                   .text('Cargo', 270, tableHeaderY, { width: 120 })
                   .text('Setor', 395, tableHeaderY, { width: 80 })
                   .text('Horário', 480, tableHeaderY, { width: 70 });

                doc.moveDown(0.5);

                // Linha do cabeçalho
                doc.moveTo(50, doc.y)
                   .lineTo(545, doc.y)
                   .strokeColor('#CCCCCC')
                   .lineWidth(0.5)
                   .stroke();

                doc.moveDown(0.3);

                // Linhas de presença
                if (presences && presences.length > 0) {
                    presences.forEach((p, index) => {
                        const confirmedAt = new Date(p.confirmed_at);
                        const timeStr = confirmedAt.toLocaleTimeString('pt-BR', timeOptions);

                        // Calcular altura dinâmica da linha
                        const rowFontSize = 9;
                        const nameH = doc.heightOfString(p.participant_name, { width: 180, size: rowFontSize });
                        const roleH = doc.heightOfString(p.participant_role, { width: 120, size: rowFontSize });
                        const sectorH = doc.heightOfString(p.participant_sector || '-', { width: 80, size: rowFontSize });
                        const rowHeight = Math.max(nameH, roleH, sectorH, 15);

                        // Verificar se precisa de nova página
                        if (doc.y + rowHeight > 750) {
                            doc.addPage();
                            doc.y = 50;
                            // Repetir cabeçalho se desejar (opcional)
                        }

                        const yPos = doc.y;
                        doc.fontSize(rowFontSize)
                           .font('Helvetica')
                           .fillColor('#333333')
                           .text(`${index + 1}`, 50, yPos, { width: 30 })
                           .text(p.participant_name, 85, yPos, { width: 180 })
                           .text(p.participant_role, 270, yPos, { width: 120 })
                           .text(p.participant_sector || '-', 395, yPos, { width: 80 })
                           .text(timeStr, 480, yPos, { width: 70 });

                        // Pular para o fim da linha baseado na altura calculada
                        doc.y = yPos + rowHeight + 2;

                        // Linha separadora
                        doc.moveTo(50, doc.y)
                           .lineTo(545, doc.y)
                           .strokeColor('#EEEEEE')
                           .lineWidth(0.3)
                           .stroke();

                        doc.moveDown(0.2);
                    });
                } else {
                    doc.fontSize(11)
                       .fillColor('#999999')
                       .text('Nenhuma presença confirmada.', { align: 'center' });
                }

                // Rodapé
                const footerText = `Documento gerado automaticamente pelo SGP em ${now.toLocaleString('pt-BR', { ...dateOptions, ...timeOptions })}`;
                doc.fontSize(8)
                   .fillColor('#999999')
                   .text(footerText, 50, 770, { align: 'center', width: 495 });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = pdfService;
