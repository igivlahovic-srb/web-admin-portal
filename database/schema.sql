-- ================================================
-- La Fantana WHS - Database Schema
-- ================================================

-- 1. Users Table
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    charismaId NVARCHAR(50) UNIQUE NOT NULL,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('super_user', 'gospodar', 'technician')),
    depot NVARCHAR(100) NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    workdayStatus NVARCHAR(20) CHECK (workdayStatus IN ('open', 'closed')),
    workdayClosedAt DATETIME2,
    workdayOpenedBy NVARCHAR(50),
    workdayReopenReason NVARCHAR(500),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (workdayOpenedBy) REFERENCES Users(id)
);

-- Index for faster lookups
CREATE INDEX IX_Users_Username ON Users(username);
CREATE INDEX IX_Users_CharismaId ON Users(charismaId);
CREATE INDEX IX_Users_Role ON Users(role);

-- 2. Service Tickets Table
CREATE TABLE ServiceTickets (
    id NVARCHAR(50) PRIMARY KEY,
    ticketNumber NVARCHAR(50) UNIQUE NOT NULL,
    technicianId NVARCHAR(50) NOT NULL,
    customerName NVARCHAR(255) NOT NULL,
    customerPhone NVARCHAR(50),
    customerAddress NVARCHAR(500),
    deviceType NVARCHAR(100),
    deviceSerialNumber NVARCHAR(100),
    problemDescription NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    startTime DATETIME2 NOT NULL,
    endTime DATETIME2,
    durationMinutes INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (technicianId) REFERENCES Users(id)
);

-- Indexes
CREATE INDEX IX_ServiceTickets_Status ON ServiceTickets(status);
CREATE INDEX IX_ServiceTickets_TechnicianId ON ServiceTickets(technicianId);
CREATE INDEX IX_ServiceTickets_StartTime ON ServiceTickets(startTime);
CREATE INDEX IX_ServiceTickets_TicketNumber ON ServiceTickets(ticketNumber);

-- 3. Operations Table (Templates)
CREATE TABLE OperationTemplates (
    id NVARCHAR(50) PRIMARY KEY,
    code NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Index
CREATE INDEX IX_OperationTemplates_Code ON OperationTemplates(code);
CREATE INDEX IX_OperationTemplates_IsActive ON OperationTemplates(isActive);

-- 4. Spare Parts Table (Templates)
CREATE TABLE SparePartTemplates (
    id NVARCHAR(50) PRIMARY KEY,
    code NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(255) NOT NULL,
    unit NVARCHAR(50) NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Index
CREATE INDEX IX_SparePartTemplates_Code ON SparePartTemplates(code);
CREATE INDEX IX_SparePartTemplates_IsActive ON SparePartTemplates(isActive);

-- 5. Ticket Operations (Many-to-Many)
CREATE TABLE TicketOperations (
    id NVARCHAR(50) PRIMARY KEY,
    ticketId NVARCHAR(50) NOT NULL,
    operationId NVARCHAR(50) NOT NULL,
    operationCode NVARCHAR(50),
    operationName NVARCHAR(255),
    operationDescription NVARCHAR(MAX),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ticketId) REFERENCES ServiceTickets(id) ON DELETE CASCADE,
    FOREIGN KEY (operationId) REFERENCES OperationTemplates(id)
);

-- Index
CREATE INDEX IX_TicketOperations_TicketId ON TicketOperations(ticketId);

-- 6. Ticket Spare Parts (Many-to-Many)
CREATE TABLE TicketSpareParts (
    id NVARCHAR(50) PRIMARY KEY,
    ticketId NVARCHAR(50) NOT NULL,
    sparePartId NVARCHAR(50) NOT NULL,
    sparePartCode NVARCHAR(50),
    sparePartName NVARCHAR(255),
    quantity DECIMAL(10, 2) NOT NULL,
    unit NVARCHAR(50),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ticketId) REFERENCES ServiceTickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sparePartId) REFERENCES SparePartTemplates(id)
);

-- Index
CREATE INDEX IX_TicketSpareParts_TicketId ON TicketSpareParts(ticketId);

-- 7. Workday Log Table
CREATE TABLE WorkdayLog (
    id NVARCHAR(50) PRIMARY KEY,
    userId NVARCHAR(50) NOT NULL,
    action NVARCHAR(50) NOT NULL CHECK (action IN ('opened', 'closed')),
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    openedBy NVARCHAR(50),
    reason NVARCHAR(500),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (openedBy) REFERENCES Users(id)
);

-- Index
CREATE INDEX IX_WorkdayLog_UserId ON WorkdayLog(userId);
CREATE INDEX IX_WorkdayLog_Timestamp ON WorkdayLog(timestamp);

-- ================================================
-- Views for easier querying
-- ================================================

-- View: Active Tickets with Technician Info
CREATE VIEW vw_ActiveTickets AS
SELECT
    t.*,
    u.name AS technicianName,
    u.depot AS technicianDepot,
    (SELECT COUNT(*) FROM TicketOperations WHERE ticketId = t.id) AS operationCount,
    (SELECT COUNT(*) FROM TicketSpareParts WHERE ticketId = t.id) AS sparePartCount
FROM ServiceTickets t
INNER JOIN Users u ON t.technicianId = u.id
WHERE t.status = 'in_progress';

-- View: Completed Tickets Summary
CREATE VIEW vw_CompletedTicketsSummary AS
SELECT
    t.*,
    u.name AS technicianName,
    u.depot AS technicianDepot,
    (SELECT COUNT(*) FROM TicketOperations WHERE ticketId = t.id) AS operationCount,
    (SELECT COUNT(*) FROM TicketSpareParts WHERE ticketId = t.id) AS sparePartCount
FROM ServiceTickets t
INNER JOIN Users u ON t.technicianId = u.id
WHERE t.status = 'completed';

-- ================================================
-- Stored Procedures
-- ================================================

-- Get All Active Users
GO
CREATE PROCEDURE sp_GetActiveUsers
AS
BEGIN
    SELECT * FROM Users WHERE isActive = 1 ORDER BY name;
END;
GO

-- Get Tickets By Technician
GO
CREATE PROCEDURE sp_GetTicketsByTechnician
    @technicianId NVARCHAR(50)
AS
BEGIN
    SELECT
        t.*,
        (SELECT COUNT(*) FROM TicketOperations WHERE ticketId = t.id) AS operationCount,
        (SELECT COUNT(*) FROM TicketSpareParts WHERE ticketId = t.id) AS sparePartCount
    FROM ServiceTickets t
    WHERE t.technicianId = @technicianId
    ORDER BY t.startTime DESC;
END;
GO

-- Get Ticket Details with Operations and Spare Parts
GO
CREATE PROCEDURE sp_GetTicketDetails
    @ticketId NVARCHAR(50)
AS
BEGIN
    -- Ticket info
    SELECT t.*, u.name AS technicianName, u.depot AS technicianDepot
    FROM ServiceTickets t
    INNER JOIN Users u ON t.technicianId = u.id
    WHERE t.id = @ticketId;

    -- Operations
    SELECT * FROM TicketOperations WHERE ticketId = @ticketId;

    -- Spare Parts
    SELECT * FROM TicketSpareParts WHERE ticketId = @ticketId;
END;
GO

-- Complete a Ticket
GO
CREATE PROCEDURE sp_CompleteTicket
    @ticketId NVARCHAR(50),
    @endTime DATETIME2
AS
BEGIN
    DECLARE @startTime DATETIME2;
    SELECT @startTime = startTime FROM ServiceTickets WHERE id = @ticketId;

    UPDATE ServiceTickets
    SET
        status = 'completed',
        endTime = @endTime,
        durationMinutes = DATEDIFF(MINUTE, @startTime, @endTime),
        updatedAt = GETDATE()
    WHERE id = @ticketId;
END;
GO

-- ================================================
-- Triggers for UpdatedAt
-- ================================================

-- Users UpdatedAt Trigger
GO
CREATE TRIGGER trg_Users_UpdatedAt
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users
    SET updatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

-- ServiceTickets UpdatedAt Trigger
GO
CREATE TRIGGER trg_ServiceTickets_UpdatedAt
ON ServiceTickets
AFTER UPDATE
AS
BEGIN
    UPDATE ServiceTickets
    SET updatedAt = GETDATE()
    FROM ServiceTickets t
    INNER JOIN inserted i ON t.id = i.id;
END;
GO
