import React, { useState } from 'react';

export default function AdvancedJobFilters({ filters, setFilters, onSearch }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Volunteer'];
  const workArrangements = ['On-site', 'Hybrid', 'Remote'];
  const seniorityLevels = ['Entry', 'Mid', 'Senior', 'Lead', 'Director', 'VP', 'Executive'];
  const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];
  const commonBenefits = ['Health Insurance', 'Pension', 'Learning & Development', 'Flexible Hours', 'Remote Working Budget', 'Gym Membership', 'Stock Options'];
  const commonSkills = ['Project Management', 'Leadership', 'Communication', 'Data Analysis', 'Problem Solving', 'Team Management', 'Strategic Planning'];

  const handleReset = () => {
    setFilters({
      search: '',
      location: '',
      employmentType: '',
      specialism: '',
      seniority: '',
      remote: false,
      workArrangement: '',
      department: '',
      minExperience: '',
      maxExperience: '',
      skill: '',
      benefit: '',
      minSalary: '',
      maxSalary: ''
    });
  };

  return (
    <div className="advanced-filters-container">
      <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="filters-form">
        {/* Basic Row */}
        <div className="filters-row basic">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search role, company, or skills…"
              value={filters.search || ''}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="filter-input large"
            />
          </div>
          <div className="filter-group">
            <input
              type="text"
              placeholder="Location"
              value={filters.location || ''}
              onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
              className="filter-input"
            />
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              🔍 Search
            </button>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn btn-secondary"
              title="Toggle advanced filters"
            >
              {showAdvanced ? '▲ Less' : '▼ More'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            {/* Row 1: Employment Type & Work Arrangement */}
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Employment Type</label>
                <div className="filter-pills">
                  {employmentTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, employmentType: f.employmentType === type ? '' : type }))}
                      className={`pill ${filters.employmentType === type ? 'active' : ''}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Work Arrangement & Remote - DISABLED until schema migration */}
            {false && (
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Work Arrangement</label>
                <div className="filter-pills">
                  {workArrangements.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, workArrangement: f.workArrangement === type ? '' : type }))}
                      className={`pill ${filters.workArrangement === type ? 'active' : ''}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Row 3: Seniority & Department - DEPARTMENT DISABLED until schema migration */}
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Seniority Level</label>
                <select
                  value={filters.seniority || ''}
                  onChange={(e) => setFilters(f => ({ ...f, seniority: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Levels</option>
                  {seniorityLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                <label className="filter-label">Department (Coming Soon)</label>
                <select disabled className="filter-select">
                  <option value="">All Departments</option>
                </select>
              </div>
            </div>

            {/* Row 4: Experience Range - DISABLED until schema migration */}
            {false && (
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Years of Experience</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="Min"
                    value={filters.minExperience || ''}
                    onChange={(e) => setFilters(f => ({ ...f, minExperience: e.target.value }))}
                    className="filter-input small"
                  />
                  <span className="range-dash">–</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="Max"
                    value={filters.maxExperience || ''}
                    onChange={(e) => setFilters(f => ({ ...f, maxExperience: e.target.value }))}
                    className="filter-input small"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Row 5: Salary Range */}
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Salary Range (£)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.minSalary || ''}
                    onChange={(e) => setFilters(f => ({ ...f, minSalary: e.target.value }))}
                    className="filter-input small"
                  />
                  <span className="range-dash">–</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.maxSalary || ''}
                    onChange={(e) => setFilters(f => ({ ...f, maxSalary: e.target.value }))}
                    className="filter-input small"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Specialisation & Skills - SKILLS DISABLED until schema migration */}
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Specialisation</label>
                <input
                  type="text"
                  placeholder="e.g., PMO, Business Analysis, Agile"
                  value={filters.specialism || ''}
                  onChange={(e) => setFilters(f => ({ ...f, specialism: e.target.value }))}
                  className="filter-input"
                />
              </div>
              <div className="filter-group" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                <label className="filter-label">Required Skill (Coming Soon)</label>
                <input
                  type="text"
                  placeholder="Search skills…"
                  disabled
                  className="filter-input"
                />
              </div>
            </div>

            {/* Row 7: Benefits - DISABLED until schema migration */}
            {false && (
            <div className="filters-row">
              <div className="filter-group full-width">
                <label className="filter-label">Benefits (Click to filter)</label>
                <div className="filter-pills">
                  {commonBenefits.map(benefit => (
                    <button
                      key={benefit}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, benefit: f.benefit === benefit ? '' : benefit }))}
                      className={`pill ${filters.benefit === benefit ? 'active' : ''}`}
                    >
                      {benefit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Action Buttons */}
            <div className="filters-actions">
              <button type="submit" className="btn btn-primary large">
                Apply Filters
              </button>
              <button type="button" onClick={handleReset} className="btn btn-outline">
                Reset All
              </button>
            </div>
          </>
        )}
      </form>

      <style jsx>{`
        .advanced-filters-container {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .filters-form {
          padding: 1.5rem;
        }

        .filters-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .filters-row.basic {
          grid-template-columns: 1fr auto;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group.full-width {
          grid-column: 1 / -1;
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          display: block;
        }

        .filter-input,
        .filter-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .filter-input.large {
          padding: 0.625rem 0.75rem;
          font-size: 1rem;
        }

        .filter-input.small {
          flex: 1;
        }

        .range-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .range-dash {
          color: #9ca3af;
          font-weight: 500;
        }

        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pill {
          padding: 0.375rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 9999px;
          background: #fff;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pill:hover {
          border-color: #4f46e5;
          background: #f0f4ff;
        }

        .pill.active {
          background: #4f46e5;
          color: #fff;
          border-color: #4f46e5;
        }

        .filter-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          grid-column: 1 / -1;
        }

        .btn {
          padding: 0.625rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-primary {
          background: #4f46e5;
          color: #fff;
        }

        .btn-primary:hover {
          background: #4338ca;
        }

        .btn-primary.large {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .btn-outline {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
        }

        .btn-outline:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .filter-actions {
          grid-column: 1 / -1;
        }

        @media (max-width: 768px) {
          .filters-row.basic {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .filter-actions {
            flex-direction: column;
          }

          .btn,
          .btn-primary,
          .btn-outline {
            width: 100%;
          }

          .filters-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
