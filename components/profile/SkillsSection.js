import { useState, useEffect } from 'react';

const PMO_SKILL_CATEGORIES = {
  'Core PMO': [
    'RAID Management', 'Risk Management', 'Issue Management', 'Dependency Tracking',
    'Governance & Compliance', 'PMO Setup & Design', 'Portfolio Management',
    'Programme Management', 'Project Management', 'Change Management',
    'Stakeholder Management', 'Benefits Realization', 'Business Case Development'
  ],
  'Planning & Scheduling': [
    'MS Project', 'Primavera P6', 'Smartsheet', 'Monday.com', 'Asana',
    'Project Scheduling', 'Resource Planning', 'Capacity Planning',
    'Critical Path Analysis', 'Gantt Charts', 'Milestone Tracking'
  ],
  'Reporting & Analytics': [
    'Dashboard Creation', 'KPI Tracking', 'Power BI', 'Tableau', 'Excel Advanced',
    'Status Reporting', 'Financial Reporting', 'Performance Metrics',
    'Data Analysis', 'Trend Analysis', 'Executive Reporting'
  ],
  'Financial Management': [
    'Budget Management', 'Cost Control', 'Financial Forecasting',
    'Investment Appraisal', 'ROI Analysis', 'Procurement', 'Contract Management',
    'Cost-Benefit Analysis', 'Expense Tracking'
  ],
  'Agile & Methodologies': [
    'Agile', 'Scrum', 'Kanban', 'SAFe', 'Lean', 'Waterfall', 'PRINCE2',
    'Hybrid Agile', 'Sprint Planning', 'Backlog Management', 'Jira',
    'Azure DevOps', 'Confluence'
  ],
  'Tools & Technology': [
    'SharePoint', 'MS Office Suite', 'Teams', 'Slack', 'Trello',
    'ServiceNow', 'Clarity PPM', 'Planview', 'Workfront',
    'Oracle Primavera', 'SAP PS', 'Wrike'
  ],
  'Soft Skills': [
    'Leadership', 'Communication', 'Negotiation', 'Conflict Resolution',
    'Team Management', 'Mentoring', 'Presentation Skills', 'Problem Solving',
    'Critical Thinking', 'Adaptability', 'Time Management'
  ]
};

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function SkillsSection({ profile, onUpdate }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'Intermediate', category: 'Core PMO' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/candidate/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      setMessage({ type: 'error', text: 'Skill name is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/candidate/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSkill)
      });

      if (res.ok) {
        const data = await res.json();
        setSkills([...skills, data.skill]);
        setShowAddModal(false);
        setNewSkill({ name: '', proficiency: 'Intermediate', category: 'Core PMO' });
        setMessage({ type: 'success', text: 'Skill added successfully!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to add skill' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Remove this skill from your profile?')) return;

    try {
      const res = await fetch(`/api/candidate/skills?id=${skillId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSkills(skills.filter(s => s.id !== skillId));
        setMessage({ type: 'success', text: 'Skill removed' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove skill' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleUpdateProficiency = async (skillId, newProficiency) => {
    try {
      const res = await fetch('/api/candidate/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: skillId, proficiency: newProficiency })
      });

      if (res.ok) {
        setSkills(skills.map(s => s.id === skillId ? { ...s, proficiency: newProficiency } : s));
        setMessage({ type: 'success', text: 'Proficiency updated' });
      }
    } catch (err) {
      console.error('Failed to update proficiency:', err);
    }
  };

  const getProficiencyColor = (level) => {
    const colors = {
      'Beginner': '#94a3b8',
      'Intermediate': '#3b82f6',
      'Advanced': '#8b5cf6',
      'Expert': '#10b981'
    };
    return colors[level] || colors.Intermediate;
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const filteredSuggestions = Object.entries(PMO_SKILL_CATEGORIES).reduce((acc, [category, skillList]) => {
    const filtered = skillList.filter(s => 
      s.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !skills.some(existing => existing.name.toLowerCase() === s.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  if (loading) {
    return <div className="section-loading">Loading skills...</div>;
  }

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2 className="section-title">Skills & Expertise</h2>
        <p className="section-description">
          Add PMO-specific skills to help employers find you for the right roles
        </p>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Add Skill
        </button>
      </div>

      <div className="section-content">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {skills.length === 0 ? (
          <div className="empty-state">
            <p>No skills added yet. Add your first skill to showcase your expertise!</p>
          </div>
        ) : (
          <div className="skills-by-category">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="skill-category-group">
                <h3 className="category-title">{category}</h3>
                <div className="skills-grid">
                  {categorySkills.map(skill => (
                    <div key={skill.id} className="skill-badge-item">
                      <div className="skill-badge-content">
                        <span className="skill-name">{skill.name}</span>
                        <select
                          value={skill.proficiency}
                          onChange={(e) => handleUpdateProficiency(skill.id, e.target.value)}
                          className="skill-proficiency-select"
                          style={{ borderColor: getProficiencyColor(skill.proficiency) }}
                        >
                          {PROFICIENCY_LEVELS.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="skill-delete-btn"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Skill</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Skill Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search or type skill name..."
                  value={newSkill.name}
                  onChange={(e) => {
                    setNewSkill({ ...newSkill, name: e.target.value });
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>

              {searchTerm && Object.keys(filteredSuggestions).length > 0 && (
                <div className="skill-suggestions">
                  <p className="suggestions-label">Suggestions:</p>
                  {Object.entries(filteredSuggestions).map(([category, suggestions]) => (
                    <div key={category} className="suggestion-category">
                      <p className="suggestion-category-name">{category}</p>
                      <div className="suggestion-pills">
                        {suggestions.slice(0, 10).map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              setNewSkill({ ...newSkill, name: suggestion, category });
                              setSearchTerm('');
                            }}
                            className="suggestion-pill"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                >
                  {Object.keys(PMO_SKILL_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Proficiency Level</label>
                <select
                  className="form-select"
                  value={newSkill.proficiency}
                  onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
                >
                  {PROFICIENCY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddSkill} className="btn-primary" disabled={saving}>
                {saving ? 'Adding...' : 'Add Skill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
