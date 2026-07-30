BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] DROP CONSTRAINT [MapGroupSectionUser_groupId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] DROP CONSTRAINT [MapGroupSectionUser_sectionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] DROP CONSTRAINT [MapGroupSectionUser_userId_fkey];

-- CreateTable
CREATE TABLE [dbo].[PartMaster] (
    [id] INT NOT NULL IDENTITY(1,1),
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [dwg] NVARCHAR(1000) NOT NULL,
    [dieNo] NVARCHAR(1000) NOT NULL,
    [qty] INT NOT NULL,
    [groupId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [PartMaster_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [PartMaster_status_df] DEFAULT 'use',
    CONSTRAINT [PartMaster_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HeaderIssueTemp] (
    [id] INT NOT NULL IDENTITY(1,1),
    [dateIssue] DATETIME2 NOT NULL,
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [qtyBox] INT NOT NULL,
    [shift] NVARCHAR(1000) NOT NULL,
    [groupId] INT NOT NULL,
    [controlLotId] INT NOT NULL,
    [idPallet] NVARCHAR(1000) NOT NULL,
    [locationId] INT NOT NULL,
    [totalBox] INT NOT NULL,
    [moveMentThreeMonth] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderIssueTemp_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderIssueTemp_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HeaderIssue] (
    [id] INT NOT NULL IDENTITY(1,1),
    [dateIssue] DATETIME2 NOT NULL,
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [qtyBox] INT NOT NULL,
    [shift] NVARCHAR(1000) NOT NULL,
    [groupId] INT NOT NULL,
    [controlLotId] INT NOT NULL,
    [idPallet] NVARCHAR(1000) NOT NULL,
    [locationId] INT NOT NULL,
    [totalBox] INT NOT NULL,
    [moveMentThreeMonth] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderIssue_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderIssue_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ControlLot] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ControlLot_status_df] DEFAULT 'use',
    CONSTRAINT [ControlLot_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Location] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Location_status_df] DEFAULT 'use',
    CONSTRAINT [Location_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BoxIssueTemp] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerId] INT NOT NULL,
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [wosNo] NVARCHAR(1000) NOT NULL,
    [dwg] NVARCHAR(1000) NOT NULL,
    [dieNo] NVARCHAR(1000) NOT NULL,
    [lotNo] NVARCHAR(1000) NOT NULL,
    [qty] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BoxIssueTemp_status_df] DEFAULT 'use',
    CONSTRAINT [BoxIssueTemp_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MapHeaderIssueTempFraction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerId] INT NOT NULL,
    [boxId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MapHeaderIssueTempFraction_status_df] DEFAULT 'use',
    CONSTRAINT [MapHeaderIssueTempFraction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MapHeaderIssueFraction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerId] INT NOT NULL,
    [boxId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MapHeaderIssueFraction_status_df] DEFAULT 'use',
    CONSTRAINT [MapHeaderIssueFraction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HeaderClosedTemp] (
    [id] INT NOT NULL IDENTITY(1,1),
    [boxId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderClosedTemp_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderClosedTemp_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HeaderClosed] (
    [id] INT NOT NULL IDENTITY(1,1),
    [closedNO] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderClosed_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderClosed_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Box] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerIssueId] INT NOT NULL,
    [headerClosedId] INT NOT NULL,
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [wosNo] NVARCHAR(1000) NOT NULL,
    [dwg] NVARCHAR(1000) NOT NULL,
    [dieNo] NVARCHAR(1000) NOT NULL,
    [lotNo] NVARCHAR(1000) NOT NULL,
    [qty] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Box_status_df] DEFAULT 'use',
    CONSTRAINT [Box_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] ADD CONSTRAINT [MapGroupSectionUser_sectionId_fkey] FOREIGN KEY ([sectionId]) REFERENCES [dbo].[Section]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] ADD CONSTRAINT [MapGroupSectionUser_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] ADD CONSTRAINT [MapGroupSectionUser_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderIssueTemp] ADD CONSTRAINT [HeaderIssueTemp_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BoxIssueTemp] ADD CONSTRAINT [BoxIssueTemp_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssueTemp]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueTempFraction] ADD CONSTRAINT [MapHeaderIssueTempFraction_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssueTemp]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueTempFraction] ADD CONSTRAINT [MapHeaderIssueTempFraction_boxId_fkey] FOREIGN KEY ([boxId]) REFERENCES [dbo].[BoxIssueTemp]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFraction] ADD CONSTRAINT [MapHeaderIssueFraction_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
