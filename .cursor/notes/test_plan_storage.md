# Storage & Documents Test Plan

**Created:** January 1, 2026  
**Epic:** EPM-2 (Supabase Storage) + EPM-44 (Document Upload)

---

## ✅ Happy Path Tests

### 1. Upload a PDF Document
- [ ] Navigate to `/app/documents`
- [ ] Click "Upload" or drag-drop a PDF file (<25MB)
- [ ] Verify upload progress shows
- [ ] Verify document appears in list after upload
- [ ] Verify document metadata correct (name, size, type, date)

### 2. Download via Signed URL
- [ ] Click download button on an uploaded document
- [ ] Verify signed URL is generated (not direct storage URL)
- [ ] Verify file downloads correctly
- [ ] Verify file content matches original

### 3. Delete Document
- [ ] Click delete button on a document
- [ ] Confirm deletion in dialog
- [ ] Verify document removed from list
- [ ] Verify storage object deleted (check Supabase dashboard)
- [ ] Verify database row deleted

### 4. Multiple File Upload
- [ ] Drag-drop 3+ files at once
- [ ] Verify all files show in preview
- [ ] Verify all files upload successfully
- [ ] Verify all files appear in document list

---

## ❌ Expected Failure Tests

### 5. Oversize File (>25MB)
- [ ] Attempt to upload a file >25MB
- [ ] Verify error message: "File size exceeds maximum of 25MB"
- [ ] Verify file is not uploaded

### 6. Disallowed MIME Type
- [ ] Attempt to upload `.exe`, `.sh`, or `.zip` file
- [ ] Verify error message about disallowed file type
- [ ] Verify file is not uploaded

### 7. Unauthenticated Access
- [ ] Log out of the application
- [ ] Attempt to access `/app/documents`
- [ ] Verify redirect to login page
- [ ] Attempt to call upload API directly (curl)
- [ ] Verify 401 Unauthorized response

### 8. Cross-User Access Attempt
- [ ] Upload a document as User A
- [ ] Log in as User B
- [ ] Verify User B cannot see User A's documents
- [ ] Attempt to download User A's file (forge signed URL)
- [ ] Verify access denied

---

## 🔧 Environment Verification

### Pre-Test Checklist
- [ ] `VITE_SUPABASE_URL` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `documents` bucket exists in Supabase Storage
- [ ] `media` bucket exists in Supabase Storage
- [ ] Database `documents` table exists with RLS

---

## Allowed MIME Types Reference

| Extension | MIME Type |
|-----------|-----------|
| `.pdf` | `application/pdf` |
| `.jpg/.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.webp` | `image/webp` |
| `.doc` | `application/msword` |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.xls` | `application/vnd.ms-excel` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

---

## Notes

- Storage uses **user-scoped paths**: `{userId}/{folder}/{type}/{uuid}-{filename}`
- Signed URLs expire in **1 hour** by default
- All storage access is **server-side only** (service role key)
- RLS is not used due to Better Auth / Supabase auth mismatch
