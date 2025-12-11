import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export default function FilterPanel({ filters, onFiltersChange, onClear }) {
  const [expanded, setExpanded] = useState({
    location: true,
    experience: true,
    skills: true,
    availability: true,
    employment: true,
    compensation: true,
    remote: true,
    rightToWork: true,
  });

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSkillsChange = (e) => {
    const value = e.target.value;
    handleFilterChange('skills', value);
  };

  const availabilityOptions = [
    { value: 'AVAILABLE_IMMEDIATE', label: 'Available Now' },
    { value: 'AVAILABLE_2_WEEKS', label: 'Within 2 Weeks' },
    { value: 'AVAILABLE_1_MONTH', label: 'Within 1 Month' },
    { value: 'NOT_AVAILABLE', label: 'Not Available' },
  ];

  const employmentTypeOptions = [
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'PERMANENT', label: 'Permanent' },
    { value: 'TEMPORARY', label: 'Temporary' },
  ];

  const rightToWorkOptions = [
    { value: 'uk', label: 'UK' },
    { value: 'eu', label: 'EU' },
    { value: 'usa', label: 'USA' },
    { value: 'aus', label: 'Australia' },
    { value: 'other', label: 'Other' },
  ];

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== undefined && v !== null
  );

  return (
    <div className="sticky top-4 w-full max-w-xs space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Location */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('location')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Location</span>
          {expanded.location ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.location && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="e.g., London, Remote"
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('experience')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Years of Experience</span>
          {expanded.experience ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.experience && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">Min</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.minExp || ''}
                onChange={(e) => handleFilterChange('minExp', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Max</label>
              <input
                type="number"
                min="0"
                placeholder="20+"
                value={filters.maxExp || ''}
                onChange={(e) => handleFilterChange('maxExp', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('skills')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Skills</span>
          {expanded.skills ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.skills && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="e.g., Scrum, Agile, JIRA"
              value={filters.skills || ''}
              onChange={handleSkillsChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Separate skills with commas</p>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('availability')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Availability</span>
          {expanded.availability ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.availability && (
          <div className="mt-3 space-y-2">
            {availabilityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="availability"
                  value={option.value}
                  checked={filters.availability === option.value}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Employment Type */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('employment')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Employment Type</span>
          {expanded.employment ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.employment && (
          <div className="mt-3 space-y-2">
            {employmentTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="employmentType"
                  value={option.value}
                  checked={filters.employmentType === option.value}
                  onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Compensation */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('compensation')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Compensation</span>
          {expanded.compensation ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.compensation && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Min Salary (£/yr)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="30000"
                value={filters.minSalary || ''}
                onChange={(e) => handleFilterChange('minSalary', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Max Salary (£/yr)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="100000"
                value={filters.maxSalary || ''}
                onChange={(e) => handleFilterChange('maxSalary', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="border-t border-gray-100 pt-3">
              <label className="block text-xs font-medium text-gray-600">
                Min Day Rate (£)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="300"
                value={filters.minDayRate || ''}
                onChange={(e) => handleFilterChange('minDayRate', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Max Day Rate (£)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="1000"
                value={filters.maxDayRate || ''}
                onChange={(e) => handleFilterChange('maxDayRate', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Remote Preference */}
      <div className="border-b border-gray-100 pb-3">
        <button
          onClick={() => toggleSection('remote')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Remote Work</span>
          {expanded.remote ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.remote && (
          <div className="mt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.remoteOnly || false}
                onChange={(e) => handleFilterChange('remoteOnly', e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Remote only</span>
            </label>
          </div>
        )}
      </div>

      {/* Right to Work */}
      <div className="pb-3">
        <button
          onClick={() => toggleSection('rightToWork')}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Right to Work</span>
          {expanded.rightToWork ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expanded.rightToWork && (
          <div className="mt-3 space-y-2">
            {rightToWorkOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={filters.rightToWork?.includes(option.value) || false}
                  onChange={(e) => {
                    const current = filters.rightToWork || '';
                    const values = current.split(',').filter(Boolean);
                    const newValues = e.target.checked
                      ? [...values, option.value]
                      : values.filter((v) => v !== option.value);
                    handleFilterChange('rightToWork', newValues.join(','));
                  }}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
