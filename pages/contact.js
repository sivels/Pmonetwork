import Head from 'next/head';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    userType: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.userType) newErrors.userType = 'Please select whether you are a Candidate or Employer';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document.querySelector(`[name="${firstErrorField}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          jobTitle: '',
          userType: '',
          subject: '',
          message: ''
        });
        // Scroll to success message
        setTimeout(() => {
          document.querySelector('#success-message')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        setErrors({ submit: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us – PMO Network</title>
        <meta name="description" content="Contact PMO Network for support, questions, or inquiries. Whether you're a PMO professional seeking opportunities or an employer looking to hire top PMO talent, we're here to help." />
        <meta name="keywords" content="PMO Network contact, PMO jobs support, PMO recruitment help, project management talent, contact support, PMO careers" />
        <link rel="canonical" href="https://www.pmonetwork.example/contact" />
        <meta property="og:title" content="Contact Us – PMO Network" />
        <meta property="og:description" content="Get in touch with PMO Network. We're here to help PMO professionals and employers connect." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.pmonetwork.example/contact" />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ContactPage',
              name: 'Contact Us – PMO Network',
              description: 'Contact PMO Network for support and inquiries',
              url: 'https://www.pmonetwork.example/contact',
              mainEntity: {
                '@type': 'Organization',
                name: 'PMO Network',
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'Customer Support',
                  email: 'support@pmonetwork.example'
                }
              }
            })
          }}
        />
      </Head>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left Column: Intro & Visual */}
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900">Contact Us</h1>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              We'd love to hear from you! Whether you're a <strong>PMO professional seeking opportunities</strong> or an <strong>employer looking to hire top PMO talent</strong>, fill out the form and our team will respond as soon as possible.
            </p>
            <p className="text-base text-slate-600 mb-8">
              Our dedicated support team is here to assist with questions about PMO jobs, recruitment services, platform features, pricing, and more.
            </p>

            {/* Visual Placeholder */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8 text-center border border-indigo-100">
              <svg className="w-32 h-32 mx-auto mb-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600 font-medium">
                We typically respond within 24 hours
              </p>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
            {success && (
              <div id="success-message" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h2 className="text-green-900 font-semibold mb-1">Message sent successfully!</h2>
                    <p className="text-green-800 text-sm">
                      Thank you for contacting PMO Network. We've received your message and will respond promptly. A confirmation email has been sent to {formData.email || 'your email address'}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* First Name & Last Name */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">
                    First Name <span className="text-red-600" aria-label="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    aria-invalid={errors.firstName ? 'true' : 'false'}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.firstName ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-red-600 text-sm mt-1" role="alert">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name <span className="text-red-600" aria-label="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    aria-invalid={errors.lastName ? 'true' : 'false'}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.lastName ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="text-red-600 text-sm mt-1" role="alert">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address <span className="text-red-600" aria-label="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.email && (
                  <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">{errors.email}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number <span className="text-slate-500 text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Company Name & Job Title */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                    Company Name <span className="text-slate-500 text-xs font-normal">(if applicable)</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-semibold text-slate-700 mb-2">
                    Job Title / Role <span className="text-slate-500 text-xs font-normal">(if applicable)</span>
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* User Type */}
              <div className="mb-4">
                <label htmlFor="userType" className="block text-sm font-semibold text-slate-700 mb-2">
                  Are you a Candidate or Employer? <span className="text-red-600" aria-label="required">*</span>
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errors.userType ? 'true' : 'false'}
                  aria-describedby={errors.userType ? 'userType-error' : undefined}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.userType ? 'border-red-500' : 'border-slate-300'}`}
                >
                  <option value="">-- Please Select --</option>
                  <option value="CANDIDATE">Candidate (PMO Professional)</option>
                  <option value="EMPLOYER">Employer (Hiring)</option>
                  <option value="OTHER">Other / General Inquiry</option>
                </select>
                {errors.userType && (
                  <p id="userType-error" className="text-red-600 text-sm mt-1" role="alert">{errors.userType}</p>
                )}
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject / Reason for Contacting <span className="text-red-600" aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errors.subject ? 'true' : 'false'}
                  aria-describedby={errors.subject ? 'subject-error' : undefined}
                  placeholder="e.g., Pricing inquiry, Job application issue, General question"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.subject ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.subject && (
                  <p id="subject-error" className="text-red-600 text-sm mt-1" role="alert">{errors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                  Message <span className="text-red-600" aria-label="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  placeholder="Tell us more about your inquiry..."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors.message ? 'border-red-500' : 'border-slate-300'}`}
                ></textarea>
                {errors.message && (
                  <p id="message-error" className="text-red-600 text-sm mt-1" role="alert">{errors.message}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
