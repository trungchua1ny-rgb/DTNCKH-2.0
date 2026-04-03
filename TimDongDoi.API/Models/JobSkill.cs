using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class JobSkill
{
    public int Id { get; set; }

    public int JobId { get; set; }

    public int SkillId { get; set; }

    public bool? IsRequired { get; set; }

    public string? Level { get; set; }

    public virtual Job Job { get; set; } = null!;

    public virtual Skill Skill { get; set; } = null!;
}
