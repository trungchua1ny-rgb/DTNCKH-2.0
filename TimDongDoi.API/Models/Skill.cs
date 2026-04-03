using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Skill
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Category { get; set; }

    public string? Icon { get; set; }

    public int? Popularity { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<JobSkill> JobSkills { get; set; } = new List<JobSkill>();

    public virtual ICollection<ProjectPositionSkill> ProjectPositionSkills { get; set; } = new List<ProjectPositionSkill>();

    public virtual ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
}
