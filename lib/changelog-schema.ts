import { z } from 'zod'

/**
 * Changelog update schema
 * Validates changelog edits before saving to database
 */
export const changelogUpdateSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),

  content_md: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must not exceed 50,000 characters'),

  version: z
    .string()
    .max(50, 'Version must not exceed 50 characters')
    .optional()
    .nullable(),

  tags: z
    .array(
      z
        .string()
        .min(1, 'Each tag must be at least 1 character')
        .max(30, 'Each tag must not exceed 30 characters')
    )
    .max(10, 'You can add up to 10 tags')
    .default([]),
})

export type ChangelogUpdateInput = z.infer<typeof changelogUpdateSchema>

/**
 * Changelog publish schema
 * Validates before publishing (ensures changelog has required fields)
 */
export const changelogPublishSchema = z.object({
  id: z.string().uuid(),
})

export type ChangelogPublishInput = z.infer<typeof changelogPublishSchema>

/**
 * Changelog delete schema
 */
export const changelogDeleteSchema = z.object({
  id: z.string().uuid(),
})

export type ChangelogDeleteInput = z.infer<typeof changelogDeleteSchema>
