/*
  Warnings:

  - Added the required column `rfId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [rfId] NVARCHAR(1000) NOT NULL,
[role] NVARCHAR(1000) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[Group] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Group_status_df] DEFAULT 'use',
    CONSTRAINT [Group_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Section] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Section_status_df] DEFAULT 'use',
    CONSTRAINT [Section_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MapGroupSectionUser] (
    [id] INT NOT NULL IDENTITY(1,1),
    [groupId] INT NOT NULL,
    [sectionId] INT NOT NULL,
    [userId] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MapGroupSectionUser_status_df] DEFAULT 'use',
    CONSTRAINT [MapGroupSectionUser_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] ADD CONSTRAINT [MapGroupSectionUser_sectionId_fkey] FOREIGN KEY ([sectionId]) REFERENCES [dbo].[Section]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] ADD CONSTRAINT [MapGroupSectionUser_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MapGroupSectionUser] ADD CONSTRAINT [MapGroupSectionUser_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
