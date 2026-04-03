using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class JobTest
{
    public int Id { get; set; }

    public int JobId { get; set; }

    public int TestId { get; set; }

    public bool? IsRequired { get; set; }

    public virtual Job Job { get; set; } = null!;

    public virtual Test Test { get; set; } = null!;
}
