using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models
{
    public partial class CompanyVerification
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int? VerifiedBy { get; set; }

        public string? DocumentType { get; set; }

        public string? DocumentUrl { get; set; }

        public string? Status { get; set; }

        public string? Notes { get; set; }

        public DateTime? SubmittedAt { get; set; }

        public DateTime? VerifiedAt { get; set; }

        // Navigation properties
        public virtual Company Company { get; set; } = null!;

        public virtual User? VerifiedByNavigation { get; set; }
    }
}