/**
 * ISP interface for file storage — segregated from ITicketService.
 *
 * Responsibility (SRP): declare the contract for uploading, retrieving, and deleting files.
 *     No ticket logic, no authentication — only storage I/O signatures.
 * Depends on: nothing — pure abstraction.
 * Pattern: ISP + DIP — useTickets hook receives IStorageService via the service layer;
 *     FileUpload component delegates to this contract without knowing the backend.
 * SOLID: ISP · DIP · LSP · OCP
 *
 * Why segregated from ITicketService:
 *     FileUpload needs storage but has no reason to know about ticket creation logic (ISP).
 *     Future modules (e.g. catalog image upload) can reuse IStorageService without
 *     coupling to ticket internals.
 *
 * OCP: new provider (GCS, Azure Blob) = new class implementing IStorageService.
 *     FileUpload and useTickets remain unchanged (DIP).
 */

export interface IStorageService {
  /**
   * Upload a file to the configured storage backend.
   * @param file - the File object selected by the user
   * @param path - destination path (e.g. 'tickets/T-2026-0001/factura.pdf')
   * @returns public or signed URL of the uploaded file
   */
  upload(file: File, path: string): Promise<string>

  /**
   * Permanently remove a file from the storage backend.
   * @param path - the same path used on upload
   */
  delete(path: string): Promise<void>

  /**
   * Return the (possibly signed) URL for an existing file.
   * @param path - storage path of the file
   * @returns accessible URL
   */
  getUrl(path: string): Promise<string>
}
