/*
    004 - Datos iniciales de CalendarioRecordatorios

    Carga los recordatorios que hoy están configurados por establecimiento
    (658 recordatorios de 65 establecimientos y 12 clasificaciones).

    Requiere 001 y 003. Se corre en ENSEMBLE.

    Qué hace:
      1. Valida que existan todos los establecimientos. Si falta alguno, corta
         sin cambiar nada y lista los que faltan.
      2. Busca cada clasificación entre las del tipo 1 (Recordatorios), sin
         distinguir mayúsculas ni acentos. Si no existe, la crea como raíz; si
         hay más de una con ese nombre, corta y avisa.
      3. Inserta los recordatorios que todavía no existen. Un recordatorio ya
         existe si coinciden establecimiento, clasificación y día; en ese caso
         no se toca (se respeta lo que se haya cargado o editado desde la pantalla).

    Todo va en una transacción: o se carga completo o no se carga nada.
    Se puede volver a correr sin error ni duplicados.

    Los datos de origen se normalizaron: días sin acentos y con mayúscula
    inicial (como los valida el webservice), nombres de clasificación
    unificados, filas repetidas eliminadas y, cuando un mismo recordatorio
    tenía varias fechas, se tomó la más reciente.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @TipoRecordatorios INT = 1;

DECLARE @Clasificaciones TABLE (
    Descripcion     NVARCHAR(100) NOT NULL PRIMARY KEY,
    ClasificacionId INT NULL
);

INSERT INTO @Clasificaciones (Descripcion) VALUES
    (N'Cagnoli a pedido'),
    (N'Centro distribución'),
    (N'Devolución'),
    (N'Festa'),
    (N'Luz Azul'),
    (N'Luz Azul Frescos'),
    (N'Luz Azul Refrigerados'),
    (N'Orali'),
    (N'Quesos esp a pedido'),
    (N'Tonadita a pedido'),
    (N'Tregar'),
    (N'Veganos');

DECLARE @Datos TABLE (
    EstablecimientoId INT           NOT NULL,
    Clasificacion     NVARCHAR(100) NOT NULL,
    Dia               VARCHAR(50)   NOT NULL,
    Frecuencia        INT           NOT NULL,
    UltimaFecha       DATE          NOT NULL,
    PRIMARY KEY (EstablecimientoId, Clasificacion, Dia)
);

INSERT INTO @Datos (EstablecimientoId, Clasificacion, Dia, Frecuencia, UltimaFecha) VALUES
    (  1, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Mitre
    (  1, N'Centro distribución', 'Lunes', 7, '20261026'),  -- Mitre
    (  1, N'Devolución', 'Martes', 7, '20261027'),  -- Mitre
    (  1, N'Festa', 'Miercoles', 7, '20261028'),  -- Mitre
    (  1, N'Luz Azul', 'Lunes', 7, '20261026'),  -- Mitre
    (  1, N'Orali', 'Viernes', 7, '20261030'),  -- Mitre
    (  1, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Mitre
    (  1, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Mitre
    (  1, N'Tregar', 'Martes', 7, '20261027'),  -- Mitre
    (  1, N'Veganos', 'Lunes', 7, '20261026'),  -- Mitre
    (  2, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- 25 de Mayo
    (  2, N'Centro distribución', 'Lunes', 7, '20261026'),  -- 25 de Mayo
    (  2, N'Devolución', 'Lunes', 7, '20261026'),  -- 25 de Mayo
    (  2, N'Festa', 'Miercoles', 7, '20261028'),  -- 25 de Mayo
    (  2, N'Luz Azul', 'Lunes', 7, '20261026'),  -- 25 de Mayo
    (  2, N'Orali', 'Viernes', 7, '20261030'),  -- 25 de Mayo
    (  2, N'Quesos esp a pedido', 'Viernes', 7, '20261030'),  -- 25 de Mayo
    (  2, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- 25 de Mayo
    (  2, N'Tregar', 'Martes', 7, '20261027'),  -- 25 de Mayo
    (  2, N'Veganos', 'Lunes', 7, '20261026'),  -- 25 de Mayo
    (  5, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Neco Centro
    (  5, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Neco Centro
    (  5, N'Devolución', 'Viernes', 14, '20261030'),  -- Neco Centro
    (  5, N'Festa', 'Miercoles', 14, '20261028'),  -- Neco Centro
    (  5, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Neco Centro
    (  5, N'Orali', 'Miercoles', 14, '20261028'),  -- Neco Centro
    (  5, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Neco Centro
    (  5, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Neco Centro
    (  5, N'Tregar', 'Martes', 14, '20261027'),  -- Neco Centro
    (  5, N'Veganos', 'Miercoles', 14, '20261028'),  -- Neco Centro
    (  6, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Neco Playa
    (  6, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Neco Playa
    (  6, N'Devolución', 'Viernes', 14, '20261030'),  -- Neco Playa
    (  6, N'Festa', 'Miercoles', 14, '20261028'),  -- Neco Playa
    (  6, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Neco Playa
    (  6, N'Orali', 'Miercoles', 14, '20261028'),  -- Neco Playa
    (  6, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Neco Playa
    (  6, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Neco Playa
    (  6, N'Tregar', 'Martes', 14, '20261027'),  -- Neco Playa
    (  6, N'Veganos', 'Miercoles', 14, '20261028'),  -- Neco Playa
    ( 16, N'Cagnoli a pedido', 'Viernes', 14, '20251128'),  -- Sucre
    ( 16, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Sucre
    ( 16, N'Devolución', 'Jueves', 14, '20261022'),  -- Sucre
    ( 16, N'Festa', 'Miercoles', 14, '20261021'),  -- Sucre
    ( 16, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Sucre
    ( 16, N'Orali', 'Miercoles', 14, '20261021'),  -- Sucre
    ( 16, N'Quesos esp a pedido', 'Jueves', 14, '20260917'),  -- Sucre
    ( 16, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Sucre
    ( 16, N'Tregar', 'Martes', 14, '20261020'),  -- Sucre
    ( 16, N'Veganos', 'Miercoles', 14, '20261021'),  -- Sucre
    (103, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Campana
    (103, N'Centro distribución', 'Lunes', 7, '20261026'),  -- Campana
    (103, N'Devolución', 'Martes', 7, '20261027'),  -- Campana
    (103, N'Festa', 'Miercoles', 7, '20261028'),  -- Campana
    (103, N'Luz Azul', 'Lunes', 7, '20261026'),  -- Campana
    (103, N'Orali', 'Viernes', 7, '20261030'),  -- Campana
    (103, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Campana
    (103, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Campana
    (103, N'Tregar', 'Martes', 7, '20261027'),  -- Campana
    (103, N'Veganos', 'Lunes', 7, '20261026'),  -- Campana
    (107, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Ensenada
    (107, N'Centro distribución', 'Jueves', 7, '20261029'),  -- Ensenada
    (107, N'Devolución', 'Viernes', 7, '20261030'),  -- Ensenada
    (107, N'Festa', 'Miercoles', 7, '20261028'),  -- Ensenada
    (107, N'Luz Azul', 'Jueves', 7, '20261029'),  -- Ensenada
    (107, N'Orali', 'Miercoles', 7, '20261028'),  -- Ensenada
    (107, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Ensenada
    (107, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Ensenada
    (107, N'Tregar', 'Martes', 7, '20261027'),  -- Ensenada
    (107, N'Veganos', 'Miercoles', 7, '20261028'),  -- Ensenada
    (108, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Tigre
    (108, N'Centro distribución', 'Lunes', 7, '20261026'),  -- Tigre
    (108, N'Devolución', 'Martes', 7, '20261027'),  -- Tigre
    (108, N'Festa', 'Miercoles', 7, '20261028'),  -- Tigre
    (108, N'Luz Azul', 'Lunes', 7, '20261026'),  -- Tigre
    (108, N'Orali', 'Viernes', 7, '20261030'),  -- Tigre
    (108, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Tigre
    (108, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Tigre
    (108, N'Tregar', 'Martes', 7, '20261027'),  -- Tigre
    (108, N'Veganos', 'Lunes', 7, '20261026'),  -- Tigre
    (111, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- MDQ Alberti
    (111, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- MDQ Alberti
    (111, N'Devolución', 'Viernes', 14, '20261030'),  -- MDQ Alberti
    (111, N'Festa', 'Miercoles', 14, '20261028'),  -- MDQ Alberti
    (111, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- MDQ Alberti
    (111, N'Orali', 'Miercoles', 14, '20261028'),  -- MDQ Alberti
    (111, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- MDQ Alberti
    (111, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- MDQ Alberti
    (111, N'Tregar', 'Martes', 14, '20261027'),  -- MDQ Alberti
    (111, N'Veganos', 'Miercoles', 14, '20261028'),  -- MDQ Alberti
    (114, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Tres Arroyos
    (114, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Tres Arroyos
    (114, N'Devolución', 'Jueves', 14, '20261022'),  -- Tres Arroyos
    (114, N'Festa', 'Miercoles', 14, '20261028'),  -- Tres Arroyos
    (114, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Tres Arroyos
    (114, N'Orali', 'Viernes', 14, '20261030'),  -- Tres Arroyos
    (114, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Tres Arroyos
    (114, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Tres Arroyos
    (114, N'Tregar', 'Martes', 14, '20261027'),  -- Tres Arroyos
    (114, N'Veganos', 'Miercoles', 14, '20261021'),  -- Tres Arroyos
    (117, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Nuñez
    (117, N'Centro distribución', 'Viernes', 14, '20261030'),  -- Nuñez
    (117, N'Devolución', 'Lunes', 14, '20261019'),  -- Nuñez
    (117, N'Festa', 'Miercoles', 14, '20261028'),  -- Nuñez
    (117, N'Luz Azul', 'Viernes', 14, '20261030'),  -- Nuñez
    (117, N'Orali', 'Viernes', 14, '20261030'),  -- Nuñez
    (117, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Nuñez
    (117, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Nuñez
    (117, N'Tregar', 'Martes', 14, '20261027'),  -- Nuñez
    (117, N'Veganos', 'Lunes', 14, '20261019'),  -- Nuñez
    (118, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Concordia
    (118, N'Centro distribución', 'Lunes', 14, '20261026'),  -- Concordia
    (118, N'Devolución', 'Martes', 14, '20261027'),  -- Concordia
    (118, N'Festa', 'Miercoles', 14, '20261021'),  -- Concordia
    (118, N'Luz Azul', 'Lunes', 14, '20261026'),  -- Concordia
    (118, N'Orali', 'Viernes', 14, '20261023'),  -- Concordia
    (118, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Concordia
    (118, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Concordia
    (118, N'Tregar', 'Martes', 14, '20261020'),  -- Concordia
    (118, N'Veganos', 'Lunes', 14, '20261026'),  -- Concordia
    (120, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Villa Urquiza
    (120, N'Centro distribución', 'Miercoles', 7, '20261028'),  -- Villa Urquiza
    (120, N'Devolución', 'Jueves', 7, '20261029'),  -- Villa Urquiza
    (120, N'Festa', 'Miercoles', 7, '20261028'),  -- Villa Urquiza
    (120, N'Luz Azul', 'Miercoles', 7, '20261028'),  -- Villa Urquiza
    (120, N'Orali', 'Miercoles', 7, '20261028'),  -- Villa Urquiza
    (120, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Villa Urquiza
    (120, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Villa Urquiza
    (120, N'Tregar', 'Martes', 7, '20261027'),  -- Villa Urquiza
    (120, N'Veganos', 'Miercoles', 7, '20261028'),  -- Villa Urquiza
    (122, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Tucuman
    (122, N'Centro distribución', 'Jueves', 7, '20261029'),  -- Tucuman
    (122, N'Devolución', 'Miercoles', 7, '20261028'),  -- Tucuman
    (122, N'Festa', 'Miercoles', 7, '20261028'),  -- Tucuman
    (122, N'Luz Azul', 'Jueves', 7, '20261029'),  -- Tucuman
    (122, N'Orali', 'Miercoles', 7, '20261028'),  -- Tucuman
    (122, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Tucuman
    (122, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Tucuman
    (122, N'Tregar', 'Martes', 7, '20261027'),  -- Tucuman
    (122, N'Veganos', 'Miercoles', 7, '20261028'),  -- Tucuman
    (123, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Saenz Peña
    (123, N'Centro distribución', 'Lunes', 14, '20261026'),  -- Saenz Peña
    (123, N'Devolución', 'Martes', 7, '20261027'),  -- Saenz Peña
    (123, N'Festa', 'Miercoles', 14, '20261021'),  -- Saenz Peña
    (123, N'Luz Azul', 'Lunes', 14, '20261026'),  -- Saenz Peña
    (123, N'Orali', 'Viernes', 14, '20261023'),  -- Saenz Peña
    (123, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Saenz Peña
    (123, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Saenz Peña
    (123, N'Tregar', 'Martes', 14, '20261020'),  -- Saenz Peña
    (123, N'Veganos', 'Lunes', 14, '20261026'),  -- Saenz Peña
    (126, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Neuquen
    (126, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Neuquen
    (126, N'Devolución', 'Viernes', 14, '20261023'),  -- Neuquen
    (126, N'Festa', 'Miercoles', 14, '20261021'),  -- Neuquen
    (126, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Neuquen
    (126, N'Orali', 'Miercoles', 14, '20261021'),  -- Neuquen
    (126, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Neuquen
    (126, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Neuquen
    (126, N'Tregar', 'Martes', 14, '20261020'),  -- Neuquen
    (126, N'Veganos', 'Miercoles', 14, '20261021'),  -- Neuquen
    (128, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Recoleta
    (128, N'Centro distribución', 'Lunes', 14, '20261026'),  -- Recoleta
    (128, N'Devolución', 'Jueves', 14, '20261029'),  -- Recoleta
    (128, N'Festa', 'Miercoles', 14, '20261021'),  -- Recoleta
    (128, N'Luz Azul', 'Lunes', 14, '20261026'),  -- Recoleta
    (128, N'Orali', 'Viernes', 14, '20261023'),  -- Recoleta
    (128, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Recoleta
    (128, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Recoleta
    (128, N'Tregar', 'Martes', 14, '20261020'),  -- Recoleta
    (128, N'Veganos', 'Viernes', 14, '20261023'),  -- Recoleta
    (129, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Belgrano
    (129, N'Centro distribución', 'Lunes', 14, '20261026'),  -- Belgrano
    (129, N'Devolución', 'Lunes', 14, '20261026'),  -- Belgrano
    (129, N'Festa', 'Miercoles', 14, '20261021'),  -- Belgrano
    (129, N'Luz Azul', 'Lunes', 14, '20261026'),  -- Belgrano
    (129, N'Orali', 'Viernes', 14, '20261023'),  -- Belgrano
    (129, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Belgrano
    (129, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Belgrano
    (129, N'Tregar', 'Martes', 14, '20261020'),  -- Belgrano
    (129, N'Veganos', 'Viernes', 14, '20261023'),  -- Belgrano
    (130, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Laprida
    (130, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Laprida
    (130, N'Devolución', 'Jueves', 14, '20261022'),  -- Laprida
    (130, N'Festa', 'Miercoles', 14, '20261028'),  -- Laprida
    (130, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Laprida
    (130, N'Orali', 'Viernes', 14, '20261030'),  -- Laprida
    (130, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Laprida
    (130, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Laprida
    (130, N'Tregar', 'Martes', 14, '20261027'),  -- Laprida
    (130, N'Veganos', 'Miercoles', 14, '20261021'),  -- Laprida
    (131, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Almagro
    (131, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Almagro
    (131, N'Devolución', 'Viernes', 14, '20261030'),  -- Almagro
    (131, N'Festa', 'Miercoles', 14, '20261028'),  -- Almagro
    (131, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Almagro
    (131, N'Orali', 'Miercoles', 14, '20261028'),  -- Almagro
    (131, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Almagro
    (131, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Almagro
    (131, N'Tregar', 'Martes', 14, '20261027'),  -- Almagro
    (131, N'Veganos', 'Miercoles', 14, '20261028'),  -- Almagro
    (136, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Yerba Buena
    (136, N'Centro distribución', 'Jueves', 7, '20261029'),  -- Yerba Buena
    (136, N'Devolución', 'Miercoles', 7, '20261028'),  -- Yerba Buena
    (136, N'Festa', 'Miercoles', 7, '20261028'),  -- Yerba Buena
    (136, N'Luz Azul', 'Jueves', 7, '20261029'),  -- Yerba Buena
    (136, N'Orali', 'Miercoles', 7, '20261028'),  -- Yerba Buena
    (136, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Yerba Buena
    (136, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Yerba Buena
    (136, N'Tregar', 'Martes', 7, '20261027'),  -- Yerba Buena
    (136, N'Veganos', 'Miercoles', 7, '20261028'),  -- Yerba Buena
    (143, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Florencio Varela
    (143, N'Centro distribución', 'Jueves', 14, '20261022'),  -- Florencio Varela
    (143, N'Devolución', 'Viernes', 14, '20261023'),  -- Florencio Varela
    (143, N'Festa', 'Miercoles', 14, '20261021'),  -- Florencio Varela
    (143, N'Luz Azul', 'Jueves', 14, '20261022'),  -- Florencio Varela
    (143, N'Orali', 'Miercoles', 14, '20261021'),  -- Florencio Varela
    (143, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Florencio Varela
    (143, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Florencio Varela
    (143, N'Tregar', 'Martes', 14, '20261020'),  -- Florencio Varela
    (143, N'Veganos', 'Miercoles', 14, '20261021'),  -- Florencio Varela
    (146, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Bariloche
    (146, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Bariloche
    (146, N'Devolución', 'Viernes', 14, '20261023'),  -- Bariloche
    (146, N'Festa', 'Miercoles', 14, '20261021'),  -- Bariloche
    (146, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Bariloche
    (146, N'Orali', 'Miercoles', 14, '20261021'),  -- Bariloche
    (146, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Bariloche
    (146, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Bariloche
    (146, N'Tregar', 'Martes', 14, '20261020'),  -- Bariloche
    (146, N'Veganos', 'Miercoles', 14, '20261021'),  -- Bariloche
    (149, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Tandil 2
    (149, N'Centro distribución', 'Viernes', 7, '20261030'),  -- Tandil 2
    (149, N'Devolución', 'Lunes', 7, '20261026'),  -- Tandil 2
    (149, N'Festa', 'Miercoles', 7, '20261028'),  -- Tandil 2
    (149, N'Luz Azul', 'Viernes', 7, '20261030'),  -- Tandil 2
    (149, N'Orali', 'Viernes', 7, '20261030'),  -- Tandil 2
    (149, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Tandil 2
    (149, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Tandil 2
    (149, N'Tregar', 'Martes', 7, '20261027'),  -- Tandil 2
    (149, N'Veganos', 'Lunes', 7, '20261026'),  -- Tandil 2
    (152, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- PalermoSoho
    (152, N'Centro distribución', 'Lunes', 14, '20261026'),  -- PalermoSoho
    (152, N'Devolución', 'Viernes', 14, '20261023'),  -- PalermoSoho
    (152, N'Festa', 'Miercoles', 14, '20261021'),  -- PalermoSoho
    (152, N'Luz Azul', 'Lunes', 14, '20261026'),  -- PalermoSoho
    (152, N'Orali', 'Viernes', 14, '20261023'),  -- PalermoSoho
    (152, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- PalermoSoho
    (152, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- PalermoSoho
    (152, N'Tregar', 'Martes', 14, '20261020'),  -- PalermoSoho
    (152, N'Veganos', 'Viernes', 14, '20261023'),  -- PalermoSoho
    (153, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Benito Juarez
    (153, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Benito Juarez
    (153, N'Devolución', 'Jueves', 14, '20261022'),  -- Benito Juarez
    (153, N'Festa', 'Miercoles', 14, '20261028'),  -- Benito Juarez
    (153, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Benito Juarez
    (153, N'Orali', 'Viernes', 14, '20261030'),  -- Benito Juarez
    (153, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Benito Juarez
    (153, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Benito Juarez
    (153, N'Tregar', 'Martes', 14, '20261027'),  -- Benito Juarez
    (153, N'Veganos', 'Miercoles', 14, '20261021'),  -- Benito Juarez
    (154, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Puerto Madryn
    (154, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Puerto Madryn
    (154, N'Devolución', 'Viernes', 14, '20261030'),  -- Puerto Madryn
    (154, N'Festa', 'Miercoles', 14, '20261028'),  -- Puerto Madryn
    (154, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Puerto Madryn
    (154, N'Orali', 'Miercoles', 14, '20261028'),  -- Puerto Madryn
    (154, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Puerto Madryn
    (154, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Puerto Madryn
    (154, N'Tregar', 'Martes', 14, '20261027'),  -- Puerto Madryn
    (154, N'Veganos', 'Miercoles', 14, '20261028'),  -- Puerto Madryn
    (158, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Neuquen 2
    (158, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Neuquen 2
    (158, N'Devolución', 'Viernes', 14, '20261023'),  -- Neuquen 2
    (158, N'Festa', 'Miercoles', 14, '20261021'),  -- Neuquen 2
    (158, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Neuquen 2
    (158, N'Orali', 'Miercoles', 14, '20261021'),  -- Neuquen 2
    (158, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Neuquen 2
    (158, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Neuquen 2
    (158, N'Tregar', 'Martes', 14, '20261020'),  -- Neuquen 2
    (158, N'Veganos', 'Miercoles', 14, '20261021'),  -- Neuquen 2
    (161, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- General Roca
    (161, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- General Roca
    (161, N'Devolución', 'Viernes', 14, '20261023'),  -- General Roca
    (161, N'Festa', 'Miercoles', 14, '20261021'),  -- General Roca
    (161, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- General Roca
    (161, N'Orali', 'Miercoles', 14, '20261021'),  -- General Roca
    (161, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- General Roca
    (161, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- General Roca
    (161, N'Tregar', 'Martes', 14, '20261020'),  -- General Roca
    (161, N'Veganos', 'Miercoles', 14, '20261021'),  -- General Roca
    (162, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Medrano
    (162, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Medrano
    (162, N'Devolución', 'Viernes', 14, '20261030'),  -- Medrano
    (162, N'Festa', 'Miercoles', 14, '20261028'),  -- Medrano
    (162, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Medrano
    (162, N'Orali', 'Miercoles', 14, '20261028'),  -- Medrano
    (162, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Medrano
    (162, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Medrano
    (162, N'Tregar', 'Martes', 14, '20261027'),  -- Medrano
    (162, N'Veganos', 'Miercoles', 14, '20261028'),  -- Medrano
    (163, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Cipolletti 2
    (163, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Cipolletti 2
    (163, N'Devolución', 'Viernes', 14, '20261023'),  -- Cipolletti 2
    (163, N'Festa', 'Miercoles', 14, '20261021'),  -- Cipolletti 2
    (163, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Cipolletti 2
    (163, N'Orali', 'Miercoles', 14, '20261021'),  -- Cipolletti 2
    (163, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Cipolletti 2
    (163, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Cipolletti 2
    (163, N'Tregar', 'Martes', 14, '20261020'),  -- Cipolletti 2
    (163, N'Veganos', 'Miercoles', 14, '20261021'),  -- Cipolletti 2
    (165, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Godoy Cruz
    (165, N'Centro distribución', 'Miercoles', 7, '20261028'),  -- Godoy Cruz
    (165, N'Devolución', 'Miercoles', 7, '20261028'),  -- Godoy Cruz
    (165, N'Festa', 'Miercoles', 7, '20261028'),  -- Godoy Cruz
    (165, N'Luz Azul', 'Miercoles', 7, '20261028'),  -- Godoy Cruz
    (165, N'Orali', 'Miercoles', 7, '20261028'),  -- Godoy Cruz
    (165, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Godoy Cruz
    (165, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Godoy Cruz
    (165, N'Tregar', 'Martes', 7, '20261027'),  -- Godoy Cruz
    (165, N'Veganos', 'Miercoles', 7, '20261028'),  -- Godoy Cruz
    (167, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Puerto Madryn 2
    (167, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 2
    (167, N'Devolución', 'Viernes', 14, '20261030'),  -- Puerto Madryn 2
    (167, N'Festa', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 2
    (167, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 2
    (167, N'Orali', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 2
    (167, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Puerto Madryn 2
    (167, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Puerto Madryn 2
    (167, N'Tregar', 'Martes', 14, '20261027'),  -- Puerto Madryn 2
    (167, N'Veganos', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 2
    (170, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Villa Crespo
    (170, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Villa Crespo
    (170, N'Devolución', 'Jueves', 14, '20261029'),  -- Villa Crespo
    (170, N'Festa', 'Miercoles', 14, '20261028'),  -- Villa Crespo
    (170, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Villa Crespo
    (170, N'Orali', 'Miercoles', 14, '20261028'),  -- Villa Crespo
    (170, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Villa Crespo
    (170, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Villa Crespo
    (170, N'Tregar', 'Martes', 14, '20261027'),  -- Villa Crespo
    (170, N'Veganos', 'Miercoles', 14, '20261028'),  -- Villa Crespo
    (173, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Lamadrid
    (173, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Lamadrid
    (173, N'Devolución', 'Jueves', 14, '20261022'),  -- Lamadrid
    (173, N'Festa', 'Miercoles', 14, '20261028'),  -- Lamadrid
    (173, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Lamadrid
    (173, N'Orali', 'Viernes', 14, '20261030'),  -- Lamadrid
    (173, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Lamadrid
    (173, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Lamadrid
    (173, N'Tregar', 'Martes', 14, '20261027'),  -- Lamadrid
    (173, N'Veganos', 'Miercoles', 14, '20261021'),  -- Lamadrid
    (174, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Parana
    (174, N'Centro distribución', 'Lunes', 14, '20261026'),  -- Parana
    (174, N'Devolución', 'Martes', 14, '20261027'),  -- Parana
    (174, N'Festa', 'Miercoles', 14, '20261021'),  -- Parana
    (174, N'Luz Azul', 'Lunes', 14, '20261026'),  -- Parana
    (174, N'Orali', 'Viernes', 14, '20261023'),  -- Parana
    (174, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Parana
    (174, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Parana
    (174, N'Tregar', 'Martes', 14, '20261020'),  -- Parana
    (174, N'Veganos', 'Lunes', 14, '20261026'),  -- Parana
    (176, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Olavarria Deposito
    (176, N'Centro distribución', 'Viernes', 7, '20261030'),  -- Olavarria Deposito
    (176, N'Centro distribución', 'Sabado', 7, '20261031'),  -- Olavarria Deposito
    (176, N'Devolución', 'Lunes', 7, '20261026'),  -- Olavarria Deposito
    (176, N'Festa', 'Miercoles', 7, '20261028'),  -- Olavarria Deposito
    (176, N'Luz Azul', 'Viernes', 7, '20261030'),  -- Olavarria Deposito
    (176, N'Luz Azul', 'Sabado', 7, '20261031'),  -- Olavarria Deposito
    (176, N'Orali', 'Viernes', 7, '20261030'),  -- Olavarria Deposito
    (176, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Olavarria Deposito
    (176, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Olavarria Deposito
    (176, N'Tregar', 'Martes', 7, '20261027'),  -- Olavarria Deposito
    (176, N'Veganos', 'Miercoles', 7, '20261028'),  -- Olavarria Deposito
    (177, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Olavarria Bolivar (II)
    (177, N'Centro distribución', 'Viernes', 7, '20261030'),  -- Olavarria Bolivar (II)
    (177, N'Centro distribución', 'Sabado', 7, '20261031'),  -- Olavarria Bolivar (II)
    (177, N'Devolución', 'Lunes', 7, '20261026'),  -- Olavarria Bolivar (II)
    (177, N'Festa', 'Miercoles', 7, '20261028'),  -- Olavarria Bolivar (II)
    (177, N'Luz Azul', 'Viernes', 7, '20261030'),  -- Olavarria Bolivar (II)
    (177, N'Luz Azul', 'Sabado', 7, '20261031'),  -- Olavarria Bolivar (II)
    (177, N'Orali', 'Viernes', 7, '20261030'),  -- Olavarria Bolivar (II)
    (177, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Olavarria Bolivar (II)
    (177, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Olavarria Bolivar (II)
    (177, N'Tregar', 'Martes', 7, '20261027'),  -- Olavarria Bolivar (II)
    (177, N'Veganos', 'Miercoles', 7, '20261028'),  -- Olavarria Bolivar (II)
    (178, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Olavarria Del Valle (I)
    (178, N'Centro distribución', 'Viernes', 7, '20261030'),  -- Olavarria Del Valle (I)
    (178, N'Centro distribución', 'Sabado', 7, '20261031'),  -- Olavarria Del Valle (I)
    (178, N'Devolución', 'Lunes', 7, '20261026'),  -- Olavarria Del Valle (I)
    (178, N'Festa', 'Miercoles', 7, '20261028'),  -- Olavarria Del Valle (I)
    (178, N'Luz Azul', 'Viernes', 7, '20261030'),  -- Olavarria Del Valle (I)
    (178, N'Luz Azul', 'Sabado', 7, '20261031'),  -- Olavarria Del Valle (I)
    (178, N'Orali', 'Viernes', 7, '20261030'),  -- Olavarria Del Valle (I)
    (178, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Olavarria Del Valle (I)
    (178, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Olavarria Del Valle (I)
    (178, N'Tregar', 'Martes', 7, '20261027'),  -- Olavarria Del Valle (I)
    (178, N'Veganos', 'Miercoles', 7, '20261028'),  -- Olavarria Del Valle (I)
    (180, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Puerto Madryn 3
    (180, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 3
    (180, N'Devolución', 'Viernes', 14, '20261030'),  -- Puerto Madryn 3
    (180, N'Festa', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 3
    (180, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 3
    (180, N'Orali', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 3
    (180, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Puerto Madryn 3
    (180, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Puerto Madryn 3
    (180, N'Tregar', 'Martes', 14, '20261027'),  -- Puerto Madryn 3
    (180, N'Veganos', 'Miercoles', 14, '20261028'),  -- Puerto Madryn 3
    (182, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Almagro 2
    (182, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Almagro 2
    (182, N'Devolución', 'Viernes', 14, '20261030'),  -- Almagro 2
    (182, N'Festa', 'Miercoles', 14, '20261028'),  -- Almagro 2
    (182, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Almagro 2
    (182, N'Orali', 'Miercoles', 14, '20261028'),  -- Almagro 2
    (182, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Almagro 2
    (182, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Almagro 2
    (182, N'Tregar', 'Martes', 14, '20261027'),  -- Almagro 2
    (182, N'Veganos', 'Miercoles', 14, '20261028'),  -- Almagro 2
    (183, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Gral Roca 2
    (183, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Gral Roca 2
    (183, N'Devolución', 'Viernes', 14, '20261023'),  -- Gral Roca 2
    (183, N'Festa', 'Miercoles', 14, '20261021'),  -- Gral Roca 2
    (183, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Gral Roca 2
    (183, N'Orali', 'Miercoles', 14, '20261021'),  -- Gral Roca 2
    (183, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Gral Roca 2
    (183, N'Tregar', 'Martes', 14, '20261020'),  -- Gral Roca 2
    (183, N'Veganos', 'Miercoles', 14, '20261021'),  -- Gral Roca 2
    (186, N'Cagnoli a pedido', 'Viernes', 7, '20261030'),  -- Olavarria Colon
    (186, N'Centro distribución', 'Viernes', 7, '20261030'),  -- Olavarria Colon
    (186, N'Centro distribución', 'Sabado', 7, '20261031'),  -- Olavarria Colon
    (186, N'Devolución', 'Lunes', 7, '20261026'),  -- Olavarria Colon
    (186, N'Festa', 'Miercoles', 7, '20261028'),  -- Olavarria Colon
    (186, N'Luz Azul', 'Viernes', 7, '20261030'),  -- Olavarria Colon
    (186, N'Luz Azul', 'Sabado', 7, '20261031'),  -- Olavarria Colon
    (186, N'Orali', 'Viernes', 7, '20261030'),  -- Olavarria Colon
    (186, N'Quesos esp a pedido', 'Jueves', 7, '20261029'),  -- Olavarria Colon
    (186, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- Olavarria Colon
    (186, N'Tregar', 'Martes', 7, '20261027'),  -- Olavarria Colon
    (186, N'Veganos', 'Miercoles', 7, '20261028'),  -- Olavarria Colon
    (187, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Cnel Suarez
    (187, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Cnel Suarez
    (187, N'Devolución', 'Jueves', 14, '20261022'),  -- Cnel Suarez
    (187, N'Festa', 'Miercoles', 14, '20261028'),  -- Cnel Suarez
    (187, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Cnel Suarez
    (187, N'Orali', 'Viernes', 14, '20261030'),  -- Cnel Suarez
    (187, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Cnel Suarez
    (187, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Cnel Suarez
    (187, N'Tregar', 'Martes', 14, '20261027'),  -- Cnel Suarez
    (187, N'Veganos', 'Miercoles', 14, '20261021'),  -- Cnel Suarez
    (190, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- FRQ 25 DE MAYO
    (190, N'Centro distribución', 'Viernes', 14, '20261023'),  -- FRQ 25 DE MAYO
    (190, N'Devolución', 'Lunes', 14, '20261019'),  -- FRQ 25 DE MAYO
    (190, N'Festa', 'Miercoles', 14, '20261021'),  -- FRQ 25 DE MAYO
    (190, N'Luz Azul', 'Lunes', 14, '20261026'),  -- FRQ 25 DE MAYO
    (190, N'Orali', 'Viernes', 14, '20261023'),  -- FRQ 25 DE MAYO
    (190, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- FRQ 25 DE MAYO
    (190, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- FRQ 25 DE MAYO
    (190, N'Tregar', 'Martes', 14, '20261020'),  -- FRQ 25 DE MAYO
    (190, N'Veganos', 'Lunes', 14, '20261026'),  -- FRQ 25 DE MAYO
    (191, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Villa del parque
    (191, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Villa del parque
    (191, N'Devolución', 'Jueves', 14, '20261022'),  -- Villa del parque
    (191, N'Festa', 'Miercoles', 14, '20261021'),  -- Villa del parque
    (191, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Villa del parque
    (191, N'Orali', 'Miercoles', 14, '20261021'),  -- Villa del parque
    (191, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Villa del parque
    (191, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Villa del parque
    (191, N'Tregar', 'Martes', 14, '20261020'),  -- Villa del parque
    (191, N'Veganos', 'Miercoles', 14, '20261021'),  -- Villa del parque
    (195, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Ramos Mejia
    (195, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Ramos Mejia
    (195, N'Devolución', 'Jueves', 14, '20261022'),  -- Ramos Mejia
    (195, N'Festa', 'Miercoles', 14, '20261021'),  -- Ramos Mejia
    (195, N'Luz Azul Frescos', 'Miercoles', 14, '20261021'),  -- Ramos Mejia
    (195, N'Luz Azul Refrigerados', 'Miercoles', 14, '20261021'),  -- Ramos Mejia
    (195, N'Orali', 'Miercoles', 14, '20261021'),  -- Ramos Mejia
    (195, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Ramos Mejia
    (195, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Ramos Mejia
    (195, N'Tregar', 'Martes', 14, '20261020'),  -- Ramos Mejia
    (195, N'Veganos', 'Miercoles', 14, '20261021'),  -- Ramos Mejia
    (196, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Quilmes
    (196, N'Centro distribución', 'Jueves', 14, '20261022'),  -- Quilmes
    (196, N'Devolución', 'Viernes', 14, '20261023'),  -- Quilmes
    (196, N'Festa', 'Miercoles', 14, '20261021'),  -- Quilmes
    (196, N'Luz Azul Frescos', 'Jueves', 14, '20261022'),  -- Quilmes
    (196, N'Luz Azul Refrigerados', 'Jueves', 14, '20261022'),  -- Quilmes
    (196, N'Orali', 'Miercoles', 14, '20261021'),  -- Quilmes
    (196, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Quilmes
    (196, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Quilmes
    (196, N'Tregar', 'Martes', 14, '20261020'),  -- Quilmes
    (196, N'Veganos', 'Miercoles', 14, '20261021'),  -- Quilmes
    (197, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Playa Union
    (197, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Playa Union
    (197, N'Devolución', 'Viernes', 14, '20261030'),  -- Playa Union
    (197, N'Festa', 'Miercoles', 14, '20261028'),  -- Playa Union
    (197, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Playa Union
    (197, N'Orali', 'Miercoles', 14, '20261028'),  -- Playa Union
    (197, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Playa Union
    (197, N'Tonadita a pedido', 'Martes', 14, '20260929'),  -- Playa Union
    (197, N'Tregar', 'Martes', 14, '20261027'),  -- Playa Union
    (197, N'Veganos', 'Miercoles', 14, '20261028'),  -- Playa Union
    (198, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- City Bell
    (198, N'Centro distribución', 'Jueves', 14, '20261022'),  -- City Bell
    (198, N'Devolución', 'Viernes', 14, '20261023'),  -- City Bell
    (198, N'Festa', 'Miercoles', 14, '20261021'),  -- City Bell
    (198, N'Luz Azul', 'Jueves', 14, '20261022'),  -- City Bell
    (198, N'Orali', 'Miercoles', 14, '20261021'),  -- City Bell
    (198, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- City Bell
    (198, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- City Bell
    (198, N'Tregar', 'Martes', 14, '20261020'),  -- City Bell
    (198, N'Veganos', 'Miercoles', 14, '20261021'),  -- City Bell
    (199, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Comodoro Rivadavia
    (199, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Comodoro Rivadavia
    (199, N'Devolución', 'Viernes', 14, '20261030'),  -- Comodoro Rivadavia
    (199, N'Festa', 'Miercoles', 14, '20261028'),  -- Comodoro Rivadavia
    (199, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Comodoro Rivadavia
    (199, N'Orali', 'Miercoles', 14, '20261028'),  -- Comodoro Rivadavia
    (199, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Comodoro Rivadavia
    (199, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Comodoro Rivadavia
    (199, N'Tregar', 'Martes', 14, '20261027'),  -- Comodoro Rivadavia
    (199, N'Veganos', 'Miercoles', 14, '20261028'),  -- Comodoro Rivadavia
    (200, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Viedma
    (200, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Viedma
    (200, N'Devolución', 'Viernes', 14, '20261030'),  -- Viedma
    (200, N'Festa', 'Miercoles', 14, '20261028'),  -- Viedma
    (200, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Viedma
    (200, N'Orali', 'Miercoles', 14, '20261028'),  -- Viedma
    (200, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Viedma
    (200, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Viedma
    (200, N'Tregar', 'Martes', 14, '20261027'),  -- Viedma
    (200, N'Veganos', 'Miercoles', 14, '20261028'),  -- Viedma
    (201, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Chascomus Propio
    (201, N'Centro distribución', 'Jueves', 14, '20261022'),  -- Chascomus Propio
    (201, N'Devolución', 'Lunes', 14, '20261026'),  -- Chascomus Propio
    (201, N'Festa', 'Miercoles', 14, '20261021'),  -- Chascomus Propio
    (201, N'Luz Azul', 'Jueves', 14, '20261022'),  -- Chascomus Propio
    (201, N'Orali', 'Miercoles', 14, '20261021'),  -- Chascomus Propio
    (201, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Chascomus Propio
    (201, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Chascomus Propio
    (201, N'Tregar', 'Martes', 14, '20261020'),  -- Chascomus Propio
    (201, N'Veganos', 'Miercoles', 14, '20261021'),  -- Chascomus Propio
    (203, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Cnel Suarez 2
    (203, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Cnel Suarez 2
    (203, N'Devolución', 'Jueves', 14, '20261022'),  -- Cnel Suarez 2
    (203, N'Festa', 'Miercoles', 14, '20261028'),  -- Cnel Suarez 2
    (203, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Cnel Suarez 2
    (203, N'Orali', 'Viernes', 14, '20261030'),  -- Cnel Suarez 2
    (203, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Cnel Suarez 2
    (203, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Cnel Suarez 2
    (203, N'Tregar', 'Martes', 14, '20261027'),  -- Cnel Suarez 2
    (203, N'Veganos', 'Miercoles', 14, '20261021'),  -- Cnel Suarez 2
    (204, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Bahia Blanca Nuevo
    (204, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Bahia Blanca Nuevo
    (204, N'Devolución', 'Viernes', 14, '20261023'),  -- Bahia Blanca Nuevo
    (204, N'Festa', 'Miercoles', 14, '20261021'),  -- Bahia Blanca Nuevo
    (204, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Bahia Blanca Nuevo
    (204, N'Orali', 'Miercoles', 14, '20261021'),  -- Bahia Blanca Nuevo
    (204, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Bahia Blanca Nuevo
    (204, N'Tonadita a pedido', 'Lunes', 14, '20261019'),  -- Bahia Blanca Nuevo
    (204, N'Tregar', 'Martes', 14, '20261020'),  -- Bahia Blanca Nuevo
    (204, N'Veganos', 'Miercoles', 14, '20261021'),  -- Bahia Blanca Nuevo
    (205, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Vicente Lopez Propio
    (205, N'Centro distribución', 'Viernes', 14, '20261030'),  -- Vicente Lopez Propio
    (205, N'Devolución', 'Lunes', 14, '20261019'),  -- Vicente Lopez Propio
    (205, N'Festa', 'Miercoles', 14, '20261028'),  -- Vicente Lopez Propio
    (205, N'Luz Azul', 'Viernes', 14, '20261030'),  -- Vicente Lopez Propio
    (205, N'Orali', 'Viernes', 14, '20261030'),  -- Vicente Lopez Propio
    (205, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Vicente Lopez Propio
    (205, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Vicente Lopez Propio
    (205, N'Tregar', 'Martes', 7, '20261027'),  -- Vicente Lopez Propio
    (205, N'Veganos', 'Lunes', 14, '20261019'),  -- Vicente Lopez Propio
    (206, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Olivos Propio
    (206, N'Centro distribución', 'Viernes', 14, '20261030'),  -- Olivos Propio
    (206, N'Devolución', 'Lunes', 14, '20261019'),  -- Olivos Propio
    (206, N'Festa', 'Miercoles', 14, '20261028'),  -- Olivos Propio
    (206, N'Luz Azul', 'Viernes', 14, '20261030'),  -- Olivos Propio
    (206, N'Orali', 'Viernes', 14, '20261030'),  -- Olivos Propio
    (206, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Olivos Propio
    (206, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Olivos Propio
    (206, N'Tregar', 'Martes', 7, '20261027'),  -- Olivos Propio
    (206, N'Veganos', 'Lunes', 14, '20261026'),  -- Olivos Propio
    (207, N'Cagnoli a pedido', 'Miercoles', 7, '20261028'),  -- San Rafael
    (207, N'Centro distribución', 'Miercoles', 7, '20261028'),  -- San Rafael
    (207, N'Devolución', 'Miercoles', 7, '20261028'),  -- San Rafael
    (207, N'Festa', 'Miercoles', 7, '20261028'),  -- San Rafael
    (207, N'Luz Azul', 'Miercoles', 7, '20261028'),  -- San Rafael
    (207, N'Orali', 'Miercoles', 7, '20261028'),  -- San Rafael
    (207, N'Quesos esp a pedido', 'Jueves', 7, '20260924'),  -- San Rafael
    (207, N'Tonadita a pedido', 'Martes', 7, '20261027'),  -- San Rafael
    (207, N'Tregar', 'Martes', 7, '20261027'),  -- San Rafael
    (207, N'Veganos', 'Miercoles', 7, '20261028'),  -- San Rafael
    (208, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Colegiales Propio
    (208, N'Centro distribución', 'Lunes', 14, '20261026'),  -- Colegiales Propio
    (208, N'Devolución', 'Viernes', 14, '20261023'),  -- Colegiales Propio
    (208, N'Festa', 'Miercoles', 14, '20261021'),  -- Colegiales Propio
    (208, N'Luz Azul', 'Lunes', 14, '20261026'),  -- Colegiales Propio
    (208, N'Orali', 'Viernes', 14, '20261023'),  -- Colegiales Propio
    (208, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Colegiales Propio
    (208, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Colegiales Propio
    (208, N'Tregar', 'Martes', 7, '20261027'),  -- Colegiales Propio
    (208, N'Veganos', 'Lunes', 14, '20261026'),  -- Colegiales Propio
    (209, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Trelew
    (209, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Trelew
    (209, N'Devolución', 'Viernes', 14, '20261030'),  -- Trelew
    (209, N'Festa', 'Miercoles', 14, '20261028'),  -- Trelew
    (209, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Trelew
    (209, N'Orali', 'Miercoles', 14, '20261028'),  -- Trelew
    (209, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Trelew
    (209, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Trelew
    (209, N'Tregar', 'Martes', 14, '20261027'),  -- Trelew
    (209, N'Veganos', 'Miercoles', 14, '20261028'),  -- Trelew
    (210, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Plottier
    (210, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Plottier
    (210, N'Devolución', 'Miercoles', 14, '20261021'),  -- Plottier
    (210, N'Festa', 'Miercoles', 14, '20261021'),  -- Plottier
    (210, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Plottier
    (210, N'Orali', 'Miercoles', 14, '20261021'),  -- Plottier
    (210, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Plottier
    (210, N'Tregar', 'Martes', 14, '20261020'),  -- Plottier
    (210, N'Veganos', 'Miercoles', 14, '20261021'),  -- Plottier
    (211, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Manuela Pedraza Propio
    (211, N'Centro distribución', 'Miercoles', 14, '20261028'),  -- Manuela Pedraza Propio
    (211, N'Devolución', 'Jueves', 14, '20261029'),  -- Manuela Pedraza Propio
    (211, N'Festa', 'Miercoles', 14, '20261028'),  -- Manuela Pedraza Propio
    (211, N'Luz Azul', 'Miercoles', 14, '20261028'),  -- Manuela Pedraza Propio
    (211, N'Orali', 'Miercoles', 14, '20261028'),  -- Manuela Pedraza Propio
    (211, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Manuela Pedraza Propio
    (211, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Manuela Pedraza Propio
    (211, N'Tregar', 'Martes', 14, '20261027'),  -- Manuela Pedraza Propio
    (211, N'Veganos', 'Miercoles', 14, '20261028'),  -- Manuela Pedraza Propio
    (212, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Mataderos
    (212, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Mataderos
    (212, N'Devolución', 'Viernes', 14, '20261023'),  -- Mataderos
    (212, N'Festa', 'Miercoles', 14, '20261021'),  -- Mataderos
    (212, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Mataderos
    (212, N'Orali', 'Miercoles', 14, '20261021'),  -- Mataderos
    (212, N'Quesos esp a pedido', 'Jueves', 14, '20260917'),  -- Mataderos
    (212, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Mataderos
    (212, N'Tregar', 'Martes', 14, '20261020'),  -- Mataderos
    (212, N'Veganos', 'Viernes', 14, '20261023'),  -- Mataderos
    (213, N'Cagnoli a pedido', 'Viernes', 14, '20261023'),  -- Rauch Nuevo
    (213, N'Centro distribución', 'Lunes', 14, '20261019'),  -- Rauch Nuevo
    (213, N'Devolución', 'Lunes', 14, '20261019'),  -- Rauch Nuevo
    (213, N'Festa', 'Miercoles', 14, '20261028'),  -- Rauch Nuevo
    (213, N'Luz Azul', 'Lunes', 14, '20261019'),  -- Rauch Nuevo
    (213, N'Orali', 'Viernes', 14, '20261030'),  -- Rauch Nuevo
    (213, N'Quesos esp a pedido', 'Jueves', 14, '20261029'),  -- Rauch Nuevo
    (213, N'Tonadita a pedido', 'Martes', 14, '20261027'),  -- Rauch Nuevo
    (213, N'Tregar', 'Martes', 14, '20261027'),  -- Rauch Nuevo
    (213, N'Veganos', 'Lunes', 14, '20261026'),  -- Rauch Nuevo
    (214, N'Cagnoli a pedido', 'Viernes', 14, '20261030'),  -- Allen
    (214, N'Centro distribución', 'Miercoles', 14, '20261021'),  -- Allen
    (214, N'Devolución', 'Viernes', 14, '20261023'),  -- Allen
    (214, N'Festa', 'Miercoles', 14, '20261021'),  -- Allen
    (214, N'Luz Azul', 'Miercoles', 14, '20261021'),  -- Allen
    (214, N'Orali', 'Miercoles', 14, '20261021'),  -- Allen
    (214, N'Quesos esp a pedido', 'Jueves', 14, '20261022'),  -- Allen
    (214, N'Tonadita a pedido', 'Martes', 14, '20261020'),  -- Allen
    (214, N'Tregar', 'Martes', 14, '20261020'),  -- Allen
    (214, N'Veganos', 'Miercoles', 14, '20261021');  -- Allen

-- 1. Establecimientos
DECLARE @Faltantes NVARCHAR(2000) = STUFF((
    SELECT DISTINCT ', ' + CAST(d.EstablecimientoId AS VARCHAR(10))
    FROM @Datos d
    WHERE NOT EXISTS (SELECT 1 FROM dbo.GWREstablecimientos e WHERE e.EstablecimientoId = d.EstablecimientoId)
    FOR XML PATH('')), 1, 2, '');

IF @Faltantes IS NOT NULL
BEGIN
    DECLARE @MsgEst NVARCHAR(2048) = N'No existen en GWREstablecimientos los establecimientos: ' + @Faltantes + N'. No se cargó nada.';
    THROW 50001, @MsgEst, 1;
END

-- 2. Clasificaciones del tipo Recordatorios con el mismo nombre (sin distinguir mayúsculas ni acentos)
DECLARE @Ambiguas NVARCHAR(2000) = STUFF((
    SELECT ', ' + c.Descripcion
    FROM @Clasificaciones c
    WHERE (SELECT COUNT(*) FROM dbo.Clasificaciones x
           WHERE x.TipoClasificacion = @TipoRecordatorios
             AND x.Descripcion COLLATE Latin1_General_CI_AI = c.Descripcion COLLATE Latin1_General_CI_AI) > 1
    FOR XML PATH('')), 1, 2, '');

IF @Ambiguas IS NOT NULL
BEGIN
    DECLARE @MsgClas NVARCHAR(2048) = N'Hay más de una clasificación de Recordatorios con el nombre: ' + @Ambiguas + N'. Dejá una sola y volvé a correr el script. No se cargó nada.';
    THROW 50002, @MsgClas, 1;
END

BEGIN TRANSACTION;

-- Crear las que faltan como raíz, al final del orden actual y en orden alfabético
INSERT INTO dbo.Clasificaciones (TipoClasificacion, ClasificacionPadreId, Descripcion, Orden, Activo)
SELECT @TipoRecordatorios, NULL, c.Descripcion,
       ISNULL((SELECT MAX(r.Orden) FROM dbo.Clasificaciones r
               WHERE r.TipoClasificacion = @TipoRecordatorios AND r.ClasificacionPadreId IS NULL), 0)
         + ROW_NUMBER() OVER (ORDER BY c.Descripcion),
       1
FROM @Clasificaciones c
WHERE NOT EXISTS (SELECT 1 FROM dbo.Clasificaciones x
                  WHERE x.TipoClasificacion = @TipoRecordatorios
                    AND x.Descripcion COLLATE Latin1_General_CI_AI = c.Descripcion COLLATE Latin1_General_CI_AI);

PRINT CONCAT('Clasificaciones creadas: ', @@ROWCOUNT);

UPDATE c
SET ClasificacionId = x.ClasificacionId
FROM @Clasificaciones c
JOIN dbo.Clasificaciones x
  ON x.TipoClasificacion = @TipoRecordatorios
 AND x.Descripcion COLLATE Latin1_General_CI_AI = c.Descripcion COLLATE Latin1_General_CI_AI;

-- 3. Recordatorios
INSERT INTO dbo.CalendarioRecordatorios (EstablecimientoId, ClasificacionId, Dia, Frecuencia, UltimaFecha)
SELECT d.EstablecimientoId, c.ClasificacionId, d.Dia, d.Frecuencia, d.UltimaFecha
FROM @Datos d
JOIN @Clasificaciones c ON c.Descripcion = d.Clasificacion
WHERE NOT EXISTS (SELECT 1 FROM dbo.CalendarioRecordatorios r
                  WHERE r.EstablecimientoId = d.EstablecimientoId
                    AND r.ClasificacionId = c.ClasificacionId
                    AND r.Dia = d.Dia);

PRINT CONCAT('Recordatorios insertados: ', @@ROWCOUNT, ' de 658');

COMMIT TRANSACTION;
GO
