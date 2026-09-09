BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[HeaderIssue] DROP CONSTRAINT [HeaderIssue_userId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Pallet] ALTER COLUMN [PalletNoId] NVARCHAR(1000) NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderIssue] ADD CONSTRAINT [HeaderIssue_palletId_fkey] FOREIGN KEY ([palletId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
