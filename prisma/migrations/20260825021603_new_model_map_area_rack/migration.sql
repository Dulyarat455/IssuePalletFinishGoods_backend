BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[MapAreaRack] (
    [id] INT NOT NULL IDENTITY(1,1),
    [rackId] INT NOT NULL,
    [areaId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MapAreaRack_status_df] DEFAULT 'use',
    CONSTRAINT [MapAreaRack_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MapAreaRack] ADD CONSTRAINT [MapAreaRack_rackId_fkey] FOREIGN KEY ([rackId]) REFERENCES [dbo].[Rack]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapAreaRack] ADD CONSTRAINT [MapAreaRack_areaId_fkey] FOREIGN KEY ([areaId]) REFERENCES [dbo].[Area]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
