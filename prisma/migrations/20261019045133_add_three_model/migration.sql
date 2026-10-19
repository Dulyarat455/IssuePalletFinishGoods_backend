BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[LocCreatePallet] (
    [id] INT NOT NULL IDENTITY(1,1),
    [palletId] INT NOT NULL,
    [headId] INT NOT NULL,
    [userId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [LocCreatePallet_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LocCreatePallet_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LocAddInPallet] (
    [id] INT NOT NULL IDENTITY(1,1),
    [palletId] INT NOT NULL,
    [headId] INT NOT NULL,
    [userId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [LocAddInPallet_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LocAddInPallet_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LocMovePallet] (
    [id] INT NOT NULL IDENTITY(1,1),
    [palletId] INT NOT NULL,
    [StartAreaId] INT NOT NULL,
    [EndAreaId] INT NOT NULL,
    [userId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [LocMovePallet_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LocMovePallet_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[LocCreatePallet] ADD CONSTRAINT [LocCreatePallet_palletId_fkey] FOREIGN KEY ([palletId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocCreatePallet] ADD CONSTRAINT [LocCreatePallet_headId_fkey] FOREIGN KEY ([headId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocCreatePallet] ADD CONSTRAINT [LocCreatePallet_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocAddInPallet] ADD CONSTRAINT [LocAddInPallet_palletId_fkey] FOREIGN KEY ([palletId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocAddInPallet] ADD CONSTRAINT [LocAddInPallet_headId_fkey] FOREIGN KEY ([headId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocAddInPallet] ADD CONSTRAINT [LocAddInPallet_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocMovePallet] ADD CONSTRAINT [LocMovePallet_palletId_fkey] FOREIGN KEY ([palletId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocMovePallet] ADD CONSTRAINT [LocMovePallet_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
