-- RIVALS ARENA - INSERCAO DE DADOS DE DEMONSTRACAO
-- Execute este arquivo depois de 01_criar_banco_tabelas.sql.
-- Senha de demonstracao dos usuarios: demo1234


USE rivals_arena_front;

INSERT INTO Times (nome, tag, jogo, pontos, descricao) VALUES
('Fragmentos','FRG','Valorant',1840,'Time de demonstração focado em jogadas coordenadas.'),
('Cinza Roxo','CRX','League of Legends',1620,'Time de demonstração com foco em macro jogo.'),
('Tatu Bola','TTB','CS2',1495,'Time de demonstração, rápido e agressivo.'),
('Eclipse BR','ECL','Valorant',1310,'Time de demonstração em ascensão.');

INSERT INTO Usuarios (nick, email, senha, jogo, pontos, vitorias, derrotas, TimeId) VALUES
('Kairo','kairo@demo.com','$2b$08$sZAfQIDYaC06B1CnMDf9eeK3FdnG/At2DKSlgxLPGTU48vsTEYyx6','Valorant',980,41,12,1),
('Lume','lume@demo.com','$2b$08$sZAfQIDYaC06B1CnMDf9eeK3FdnG/At2DKSlgxLPGTU48vsTEYyx6','Valorant',910,37,15,2),
('Brisa','brisa@demo.com','$2b$08$sZAfQIDYaC06B1CnMDf9eeK3FdnG/At2DKSlgxLPGTU48vsTEYyx6','Valorant',860,33,18,3),
('Vexa','vexa@demo.com','$2b$08$sZAfQIDYaC06B1CnMDf9eeK3FdnG/At2DKSlgxLPGTU48vsTEYyx6','Valorant',790,29,20,4);

INSERT INTO Campeonatos (nome, jogo, status, premio, vagas, dataInicio, descricao) VALUES
('Copa Arena Open','Valorant','aberto','R$ 2.000',16,'2026-12-05','Torneio aberto de demonstração, eliminatória simples.'),
('Liga Rivals','League of Legends','andamento','R$ 5.000',8,'2026-10-20','Liga de demonstração em pontos corridos.'),
('Desafio Fragmento','CS2','encerrado','R$ 1.000',8,'2026-09-01','Edição encerrada, usada como exemplo.');

INSERT INTO Inscricaos (TimeId, CampeonatoId) VALUES
(1,1),(4,1),(2,2),(3,3);

INSERT INTO Partidas (CampeonatoId, timeAId, timeBId, status, placarA, placarB, dataHora) VALUES
(2,2,4,'ao_vivo',1,1,NOW()),
(1,1,4,'agendada',0,0,DATE_ADD(NOW(), INTERVAL 3 DAY)),
(3,3,1,'finalizada',13,9,DATE_SUB(NOW(), INTERVAL 30 DAY));

INSERT INTO Publicacaos (texto, categoria, UsuarioId) VALUES
('Alguém para completar o time no Valorant? Procuro duelista.','procura-time',1),
('Dica: treinem o posicionamento antes de pensar em mira.','dicas',2);

INSERT IGNORE INTO Jogos (nome) VALUES
('Valorant'),('League of Legends'),('CS2'),('Fortnite'),('Rocket League'),
('Free Fire'),('Rainbow Six Siege'),('Dota 2'),('Apex Legends'),('EA FC'),
('Counter-Strike 2');
