BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[BoxIssueTemp] ADD [timeStmp] DATETIME2 NOT NULL CONSTRAINT [BoxIssueTemp_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssue] ADD [timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderIssue_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTemp] ADD [timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderIssueTemp_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[MapHeaderIssueFraction] ADD [timeStmp] DATETIME2 NOT NULL CONSTRAINT [MapHeaderIssueFraction_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[MapHeaderIssueTempFraction] ADD [timeStmp] DATETIME2 NOT NULL CONSTRAINT [MapHeaderIssueTempFraction_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
