// Usage: node scripts/seedCandidateProfile.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function main() {


  // Seed for test.candidate@example.com
  const defaultTestEmail = process.env.TEST_CANDIDATE_EMAIL || 'test.candidate@example.com';
  const defaultTestPassword = process.env.TEST_CANDIDATE_PASSWORD || 'test1234';
  const defaultTestHashed = await hashPassword(defaultTestPassword);

  let user = await prisma.user.findUnique({ where: { email: defaultTestEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultTestEmail,
        role: 'candidate',
        password: defaultTestHashed,
      }
    });
    console.log(`Created user: ${defaultTestEmail} with password: ${defaultTestPassword}`);
  } else {
    await prisma.user.update({
      where: { email: defaultTestEmail },
      data: { password: defaultTestHashed }
    });
    console.log(`Updated password for user: ${defaultTestEmail} to: ${defaultTestPassword}`);
  }


  // Seed for candidate.rt@test.local
  const rtEmail = 'candidate.rt@test.local';
  const rtPassword = 'test1234';
  const rtHashed = await hashPassword(rtPassword);

  let rtUser = await prisma.user.findUnique({ where: { email: rtEmail } });
  if (!rtUser) {
    rtUser = await prisma.user.create({
      data: {
        email: rtEmail,
        role: 'candidate',
        password: rtHashed,
      }
    });
    console.log(`Created user: ${rtEmail} with password: ${rtPassword}`);
  } else {
    await prisma.user.update({
      where: { email: rtEmail },
      data: { password: rtHashed }
    });
    console.log(`Updated password for user: ${rtEmail} to: ${rtPassword}`);
  }

  // Seed candidate profile for candidate.rt@test.local
  let rtProfile = await prisma.candidateProfile.findUnique({ where: { userId: rtUser.id } });
  if (!rtProfile) {
    rtProfile = await prisma.candidateProfile.create({
      data: {
        userId: rtUser.id,
        fullName: 'RT Candidate',
        jobTitle: 'Right to Work Analyst',
        location: 'Birmingham, UK',
        summary: 'Specialist in right to work compliance and privacy for UK/EU candidates. 8+ years experience in legal and HR sectors.',
        yearsExperience: 8,
        sector: 'Legal & HR',
        dayRate: 450,
        salaryExpectation: 90000,
        availability: 'Immediate',
        remotePreference: 'remote',
        employmentType: 'permanent',
        rightToWork: 'UK Settled Status',
        linkedinUrl: 'https://linkedin.com/in/rtcandidate',
        portfolioUrl: 'https://portfolio.rtcandidate.com',
        githubUrl: 'https://github.com/rtcandidate',
        websiteUrl: 'https://rtcandidate.com',
        profilePhotoUrl: '/images/avatar-placeholder.svg',
        isPublic: true,
        showSalary: true,
        showProfilePhoto: true,
        anonymousMode: false,
        completionStyle: 'bar',
      }
    });
  }

  // Add skills for RT Candidate
  await prisma.skill.createMany({
    data: [
      { name: 'Right to Work Checks', proficiency: 'Expert', candidateId: rtProfile.id },
      { name: 'GDPR Compliance', proficiency: 'Advanced', candidateId: rtProfile.id },
      { name: 'HR Policy', proficiency: 'Advanced', candidateId: rtProfile.id },
      { name: 'Legal Research', proficiency: 'Intermediate', candidateId: rtProfile.id },
      { name: 'Privacy Audits', proficiency: 'Expert', candidateId: rtProfile.id },
    ]
  });

  // Add certifications for RT Candidate
  await prisma.certification.createMany({
    data: [
      { title: 'GDPR Practitioner', issuingBody: 'ICO', issueDate: new Date('2021-03-01'), candidateId: rtProfile.id },
      { title: 'Right to Work Specialist', issuingBody: 'HR Institute', issueDate: new Date('2019-07-15'), candidateId: rtProfile.id },
    ]
  });

  // Add experience for RT Candidate
  await prisma.experience.createMany({
    data: [
      {
        jobTitle: 'Compliance Lead',
        company: 'LegalWorks Ltd',
        location: 'Birmingham',
        startDate: new Date('2022-01-01'),
        endDate: null,
        description: 'Led compliance team for right to work and privacy audits, implemented new HR policies.',
        candidateId: rtProfile.id
      },
      {
        jobTitle: 'HR Analyst',
        company: 'HR Solutions',
        location: 'Leeds',
        startDate: new Date('2017-04-01'),
        endDate: new Date('2021-12-31'),
        description: 'Managed right to work checks, GDPR compliance, and employee onboarding.',
        candidateId: rtProfile.id
      }
    ]
  });

  // Add education for RT Candidate
  await prisma.education.createMany({
    data: [
      {
        degree: 'LLB Law',
        institution: 'University of Birmingham',
        startDate: new Date('2012-09-01'),
        endDate: new Date('2015-06-30'),
        candidateId: rtProfile.id
      }
    ]
  });

  // Add documents for RT Candidate
  await prisma.document.createMany({
    data: [
      {
        filename: 'RTCandidateCV.pdf',
        url: '/uploads/rtcandidatecv.pdf',
        candidateId: rtProfile.id
      },
      {
        filename: 'PrivacyStatement.pdf',
        url: '/uploads/privacystatement.pdf',
        candidateId: rtProfile.id
      }
    ]
  });

  let profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        fullName: 'Test Candidate',
        jobTitle: 'Senior PMO Analyst',
        location: 'London, UK',
        summary: 'Experienced PMO Analyst with 10+ years in project delivery, governance, and transformation. Passionate about driving results and building high-performing teams.',
        yearsExperience: 10,
        sector: 'Financial Services',
        dayRate: 600,
        salaryExpectation: 120000,
        availability: 'Immediate',
        remotePreference: 'hybrid',
        employmentType: 'contract',
        rightToWork: 'UK Citizen',
        linkedinUrl: 'https://linkedin.com/in/testcandidate',
        portfolioUrl: 'https://portfolio.example.com',
        githubUrl: 'https://github.com/testcandidate',
        websiteUrl: 'https://testcandidate.com',
        profilePhotoUrl: '/images/avatar-placeholder.svg',
        isPublic: true,
        showSalary: true,
        showProfilePhoto: true,
        anonymousMode: false,
        completionStyle: 'ring',
      }
    });
  }

  // Add skills
  await prisma.skill.createMany({
    data: [
      { name: 'Project Governance', proficiency: 'Expert', candidateId: profile.id },
      { name: 'Stakeholder Management', proficiency: 'Advanced', candidateId: profile.id },
      { name: 'Risk Management', proficiency: 'Advanced', candidateId: profile.id },
      { name: 'Agile Delivery', proficiency: 'Intermediate', candidateId: profile.id },
      { name: 'Reporting & Analytics', proficiency: 'Expert', candidateId: profile.id },
    ]
  });

  // Add certifications
  await prisma.certification.createMany({
    data: [
      { title: 'PRINCE2 Practitioner', issuingBody: 'AXELOS', issueDate: new Date('2018-05-01'), candidateId: profile.id },
      { title: 'PMI PMP', issuingBody: 'PMI', issueDate: new Date('2016-09-15'), candidateId: profile.id },
    ]
  });

  // Add experience
  await prisma.experience.createMany({
    data: [
      {
        jobTitle: 'PMO Lead',
        company: 'Big Bank PLC',
        location: 'London',
        startDate: new Date('2020-01-01'),
        endDate: null,
        description: 'Led PMO for digital transformation, managed £20m budget, delivered key regulatory projects.',
        candidateId: profile.id
      },
      {
        jobTitle: 'Project Analyst',
        company: 'Tech Solutions Ltd',
        location: 'Manchester',
        startDate: new Date('2015-03-01'),
        endDate: new Date('2019-12-31'),
        description: 'Supported multiple project teams, improved reporting processes, implemented risk controls.',
        candidateId: profile.id
      }
    ]
  });

  // Add education
  await prisma.education.createMany({
    data: [
      {
        degree: 'BSc Business Management',
        institution: 'University of London',
        startDate: new Date('2010-09-01'),
        endDate: new Date('2013-06-30'),
        candidateId: profile.id
      }
    ]
  });

  // Add documents
  await prisma.document.createMany({
    data: [
      {
        filename: 'TestCandidateCV.pdf',
        url: '/uploads/testcandidatecv.pdf',
        candidateId: profile.id
      },
      {
        filename: 'CoverLetter.pdf',
        url: '/uploads/coverletter.pdf',
        candidateId: profile.id
      }
    ]
  });

  console.log('Test candidate profile seeded:', email);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
