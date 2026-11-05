BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssue] ADD [mapSpecialCodeModelId] INT;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTemp] ADD [mapSpecialCodeModelId] INT;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTempTAC] ADD [mapSpecialCodeModelId] INT;

-- CreateTable
CREATE TABLE [dbo].[MapSpecialCodeModel] (
    [id] INT NOT NULL IDENTITY(1,1),
    [specialCodeName] NVARCHAR(1000) NOT NULL,
    [partMasterId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [MapSpecialCodeModel_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MapSpecialCodeModel_status_df] DEFAULT 'use',
    CONSTRAINT [MapSpecialCodeModel_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MapSpecialCodeModel] ADD CONSTRAINT [MapSpecialCodeModel_partMasterId_fkey] FOREIGN KEY ([partMasterId]) REFERENCES [dbo].[PartMaster]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
