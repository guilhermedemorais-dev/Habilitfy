-- =======================================================
-- SCRIPT DE SEED COMPLETO: PRODUÇÃO (Admin + Instrutores)
-- =======================================================

-- -------------------------------------------------------
-- 1. USUÁRIOS NATIVOS (Admin & Suporte)
-- -------------------------------------------------------

-- Admin Master (Login: guilhermemp.business@gmail.com / Senha: Habilitfy@2024)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `admin_role`, `is_verified`, `kyc_status`)
VALUES 
(UUID(), 'guilhermemp.business@gmail.com', 'b42a6d5073175c5717367095e3e264500902c5256e0775a2bfba82049175c40026e2a22904aaef7d3d7894a423dd775d7962450877995f32993c12662c1032cf.a1b2c3d4e5f60718293a4b5c6d7e8f90', 'admin', 'Guilherme Morais', 'master', 1, 'approved');

-- Suporte HabilitFy (Login: suporte@habilitfy.com.br / Senha: Suporte@2024)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `admin_role`, `is_verified`, `kyc_status`)
VALUES 
(UUID(), 'suporte@habilitfy.com.br', 'f7d32b21bf0d6eef75cabbbcb6f9ddabb7c597b2e8599cd486961e5aaa5c8b47d3d531462426f7339df43458882966c5330e0c2f1a7b1189018c819b22739cbe.13d4deafe32e10fa2defa576dfe30576', 'admin', 'Suporte HabilitFy', 'support', 1, 'approved');

-- -------------------------------------------------------
-- 2. INSTRUTORES FICTÍCIOS (RJ)
-- Senha padrão para todos: Instrutor@2024
-- -------------------------------------------------------
SET @pass_hash = '3663c9ad053c536291a38c20e7e5d6bf86717cb73489f8ebc8209dbc0268d6ac3b23e63f4b81206090ee9c3044b9c13010dcb32b5560776611c950b2ae534106.e23925b1855ec0e483d4a30ce1999307';

-- CARLOS MENDES (Copacabana)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'carlos.mendes@teste.com', @pass_hash, 'instructor', 'Carlos Mendes', 1, 'approved');
SET @id_1 = (SELECT id FROM `users` WHERE email = 'carlos.mendes@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_1, 'Instrutor paciente com 15 anos de experiência.', 80.00, 'Hyundai HB20', 'Carro Manual', '2022', 4.9, 124, 'Copacabana', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/men/32.jpg');

-- FERNANDA OLIVEIRA (Tijuca)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'fernanda.oliveira@teste.com', @pass_hash, 'instructor', 'Fernanda Oliveira', 1, 'approved');
SET @id_2 = (SELECT id FROM `users` WHERE email = 'fernanda.oliveira@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_2, 'Aulas dinâmicas em carro automático.', 95.00, 'Honda Fit', 'Carro Automático', '2023', 5.0, 89, 'Tijuca', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/women/44.jpg');

-- MARCOS SILVA (Barra)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'marcos.silva@teste.com', @pass_hash, 'instructor', 'Marcos Silva', 1, 'approved');
SET @id_3 = (SELECT id FROM `users` WHERE email = 'marcos.silva@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_3, 'Instrutor de moto categoria A.', 70.00, 'Honda CG 160', 'Moto', '2024', 4.8, 56, 'Barra da Tijuca', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/men/85.jpg');

-- JULIANA COSTA (Botafogo)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'juliana.costa@teste.com', @pass_hash, 'instructor', 'Juliana Costa', 1, 'approved');
SET @id_4 = (SELECT id FROM `users` WHERE email = 'juliana.costa@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_4, 'Calma e didática. Perfeita para recém-habilitados.', 85.00, 'Volkswagen Gol', 'Carro Manual', '2021', 4.9, 210, 'Botafogo', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/women/68.jpg');

-- ROBERTO ALMEIDA (Centro)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'roberto.almeida@teste.com', @pass_hash, 'instructor', 'Roberto Almeida', 1, 'approved');
SET @id_5 = (SELECT id FROM `users` WHERE email = 'roberto.almeida@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_5, 'Experiência em trânsito pesado e direção defensiva.', 75.00, 'Fiat Argo', 'Carro Manual', '2022', 4.7, 145, 'Centro', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/men/22.jpg');

-- ANA PAULA SOUZA (Meier)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'ana.souza@teste.com', @pass_hash, 'instructor', 'Ana Paula Souza', 1, 'approved');
SET @id_6 = (SELECT id FROM `users` WHERE email = 'ana.souza@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_6, 'Instrutora de moto focada em mulheres.', 75.00, 'Yamaha Fazer 150', 'Moto', '2023', 5.0, 78, 'Méier', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/women/90.jpg');

-- LUCAS PEREIRA (Recreio)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'lucas.pereira@teste.com', @pass_hash, 'instructor', 'Lucas Pereira', 1, 'approved');
SET @id_7 = (SELECT id FROM `users` WHERE email = 'lucas.pereira@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_7, 'Aulas relaxadas no Recreio. Carro novo e confortável.', 100.00, 'Toyota Yaris', 'Carro Automático', '2024', 4.8, 45, 'Recreio dos Bandeirantes', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/men/54.jpg');

-- PATRICIA LIMA (Jacarepaguá)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'patricia.lima@teste.com', @pass_hash, 'instructor', 'Patricia Lima', 1, 'approved');
SET @id_8 = (SELECT id FROM `users` WHERE email = 'patricia.lima@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_8, 'Instrutora credenciada pelo DETRAN.', 80.00, 'Chevrolet Onix', 'Carro Manual', '2022', 4.9, 112, 'Jacarepaguá', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/women/28.jpg');

-- RICARDO GOMES (Gávea)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'ricardo.gomes@teste.com', @pass_hash, 'instructor', 'Ricardo Gomes', 1, 'approved');
SET @id_9 = (SELECT id FROM `users` WHERE email = 'ricardo.gomes@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_9, 'Aulas VIP em carro blindado.', 150.00, 'Jeep Compass', 'Carro Automático', '2023', 5.0, 30, 'Gávea', 'Rio de Janeiro', 'RJ', 'https://randomuser.me/api/portraits/men/76.jpg');

-- CAMILA RODRIGUES (Niteroi)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `role`, `name`, `is_verified`, `kyc_status`) VALUES 
(UUID(), 'camila.rodrigues@teste.com', @pass_hash, 'instructor', 'Camila Rodrigues', 1, 'approved');
SET @id_10 = (SELECT id FROM `users` WHERE email = 'camila.rodrigues@teste.com');
INSERT IGNORE INTO `instructors` (`id`, `user_id`, `bio`, `price_per_hour`, `vehicle_model`, `vehicle_type`, `vehicle_year`, `rating`, `reviews_count`, `neighborhood`, `city`, `state`, `profile_image_url`) VALUES
(UUID(), @id_10, 'Atendo Niterói e São Gonçalo.', 70.00, 'Renault Kwid', 'Carro Manual', '2022', 4.6, 95, 'Icaraí', 'Niterói', 'RJ', 'https://randomuser.me/api/portraits/women/12.jpg');
