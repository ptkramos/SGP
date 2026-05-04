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

                // Logo do rodapé no cabeçalho do PDF (se existir). PDFKit suporta JPG/PNG, não suporta WebP.
                const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'logo-rodape.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 30, { height: 50 });
                    doc.moveDown(3);
                } else {
                    // Cabeçalho textual
                    doc.fontSize(10)
                       .fillColor('#666666')
                       .text('Hospital Cardoso Fontes', { align: 'center' });
                    doc.moveDown(0.5);
                }

                // Título
                doc.fontSize(18)
                   .fillColor('#003D5B')
                   .text('LISTA DE PRESENÇA', { align: 'center' });
                
                doc.moveDown(0.5);

                // Informações da lista
                const tipoLabel = list.type === 'reuniao' ? 'Reunião' : 'Treinamento';
                const eventDate = new Date(list.event_date + 'T12:00:00');
                const dateFormatted = eventDate.toLocaleDateString('pt-BR');

                doc.fontSize(12)
                   .fillColor('#333333');

                doc.text(`Tipo: ${tipoLabel}`, { continued: false });
                doc.text(`Título: ${list.title}`);
                doc.text(`Data: ${dateFormatted}`);
                doc.text(`Código: ${list.code}`);
                doc.text(`Criado por: ${list.creator_name || 'N/A'}`);
                
                doc.moveDown(1);

                // Linha separadora
                doc.moveTo(50, doc.y)
                   .lineTo(545, doc.y)
                   .strokeColor('#00A0D2')
                   .lineWidth(2)
                   .stroke();

                doc.moveDown(0.5);

                // Tabela de presenças
                doc.fontSize(11)
                   .fillColor('#003D5B')
                   .text('Nº', 50, doc.y, { width: 30 })
                   .text('Nome Completo', 85, doc.y - 15, { width: 180 })
                   .text('Cargo', 270, doc.y - 15, { width: 120 })
                   .text('Setor', 395, doc.y - 15, { width: 80 })
                   .text('Horário', 480, doc.y - 15, { width: 70 });

                doc.moveDown(0.3);

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
                        // Verificar se precisa de nova página
                        if (doc.y > 720) {
                            doc.addPage();
                            doc.y = 50;
                        }

                        const confirmedAt = new Date(p.confirmed_at);
                        const timeStr = confirmedAt.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });

                        const yPos = doc.y;
                        doc.fontSize(10)
                           .fillColor('#333333')
                           .text(`${index + 1}`, 50, yPos, { width: 30 })
                           .text(p.participant_name, 85, yPos, { width: 180 })
                           .text(p.participant_role, 270, yPos, { width: 120 })
                           .text(p.participant_sector || '-', 395, yPos, { width: 80 })
                           .text(timeStr, 480, yPos, { width: 70 });

                        doc.moveDown(0.5);

                        // Linha separadora
                        doc.moveTo(50, doc.y)
                           .lineTo(545, doc.y)
                           .strokeColor('#EEEEEE')
                           .lineWidth(0.3)
                           .stroke();

                        doc.moveDown(0.3);
                    });
                } else {
                    doc.fontSize(11)
                       .fillColor('#999999')
                       .text('Nenhuma presença confirmada.', { align: 'center' });
                }

                // Rodapé
                doc.moveDown(2);
                doc.fontSize(8)
                   .fillColor('#999999')
                   .text(
                       `Documento gerado automaticamente pelo SGP em ${new Date().toLocaleString('pt-BR')}`,
                       50, 770,
                       { align: 'center', width: 495 }
                   );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = pdfService;
