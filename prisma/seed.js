const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SKILLS_POOL = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'Ruby',
  'Vue.js', 'Angular', 'Next.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
  'Azure', 'GCP', 'CI/CD', 'Git', 'Agile', 'Scrum', 'REST APIs', 'GraphQL',
  'SQL', 'NoSQL', 'Microservices', 'DevOps', 'Linux', 'Project Management',
  'Stakeholder Management', 'Requirements Analysis', 'Risk Management', 'Jira'
];

const LOCATIONS = [
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Remote - UK',
  'Edinburgh, UK', 'Bristol, UK', 'Leeds, UK', 'Glasgow, UK'
];

const JOB_TITLES = [
  { title: 'Senior Project Manager', type: 'PERMANENT', seniority: 'Senior', salaryMin: 60000, salaryMax: 85000 },
  { title: 'Product Manager', type: 'CONTRACT', seniority: 'Mid', salaryMin: 500, salaryMax: 700 },
  { title: 'Technical Project Manager', type: 'PERMANENT', seniority: 'Senior', salaryMin: 70000, salaryMax: 95000 },
  { title: 'Scrum Master', type: 'CONTRACT', seniority: 'Mid', salaryMin: 450, salaryMax: 600 },
  { title: 'Programme Manager', type: 'PERMANENT', seniority: 'Lead', salaryMin: 85000, salaryMax: 120000 },
  { title: 'Delivery Manager', type: 'CONTRACT', seniority: 'Senior', salaryMin: 550, salaryMax: 750 },
  { title: 'Agile Coach', type: 'CONTRACT', seniority: 'Senior', salaryMin: 600, salaryMax: 800 },
  { title: 'Junior Project Manager', type: 'PERMANENT', seniority: 'Junior', salaryMin: 35000, salaryMax: 50000 },
];

const CANDIDATE_NAMES = [
  { fullName: 'Alex Morgan', jobTitle: 'Senior Product Manager' },
  { fullName: 'Sam Rivera', jobTitle: 'Technical Project Manager' },
  { fullName: 'Jordan Taylor', jobTitle: 'Agile Scrum Master' },
  { fullName: 'Casey Bennett', jobTitle: 'Programme Manager' },
  { fullName: 'Morgan Ellis', jobTitle: 'Delivery Manager' },
  { fullName: 'Riley Chen', jobTitle: 'Senior Project Manager' },
  { fullName: 'Quinn Davis', jobTitle: 'Product Owner' },
  { fullName: 'Blake Martinez', jobTitle: 'Digital Project Manager' },
  { fullName: 'Avery Wilson', jobTitle: 'Transformation Manager' },
  { fullName: 'Harper Anderson', jobTitle: 'Agile Coach' },
  { fullName: 'Peyton Thompson', jobTitle: 'IT Project Manager' },
  { fullName: 'Reese Campbell', jobTitle: 'PMO Lead' },
  { fullName: 'Dakota Moore', jobTitle: 'Change Manager' },
  { fullName: 'Skylar Jackson', jobTitle: 'Project Coordinator' },
  { fullName: 'Phoenix White', jobTitle: 'Business Analyst' },
];

const COMPANIES = [
  { name: 'TechVision Solutions', contact: 'Sarah Johnson' },
  { name: 'Digital Innovations Ltd', contact: 'Michael Chen' },
  { name: 'Future Systems Group', contact: 'Emma Thompson' },
  { name: 'CloudScale Partners', contact: 'James Wilson' },
  { name: 'Agile Dynamics', contact: 'Lisa Anderson' },
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysAgo));
  return date;
}

function randomSkills(count) {
  const shuffled = [...SKILLS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create employer users and profiles
  console.log('Creating employers...');
  const employers = [];
  
  for (const company of COMPANIES) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const email = `${company.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'EMPLOYER',
        emailVerified: new Date(),
        employerEmployerProfile: {
          create: {
            companyName: company.name,
            contactName: company.contact,
            website: `https://www.${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+44 20 ${randomInt(7000, 9999)} ${randomInt(1000, 9999)}`,
          }
        }
      },
      include: { employerEmployerProfile: true }
    });
    
    employers.push(user);
    console.log(`  ✓ Created employer: ${company.name}`);
  }

  // Create jobs for each employer
  console.log('\nCreating jobs...');
  const jobs = [];
  
  for (const employer of employers) {
    const jobCount = randomInt(1, 3);
    
    for (let i = 0; i < jobCount; i++) {
      const jobTemplate = randomElement(JOB_TITLES);
      const isRemote = Math.random() > 0.5;
      
      const job = await prisma.job.create({
        data: {
          employerId: employer.employerEmployerProfile.id,
          title: jobTemplate.title,
          description: `We are seeking an experienced ${jobTemplate.title} to join our dynamic team. You will be responsible for managing key projects, coordinating with stakeholders, and ensuring successful delivery.\n\nKey Responsibilities:\n- Lead project planning and execution\n- Manage project budgets and timelines\n- Coordinate cross-functional teams\n- Communicate with stakeholders\n- Implement agile methodologies\n\nRequired Skills:\n- Strong leadership abilities\n- Excellent communication skills\n- Experience with project management tools\n- Proven track record of delivery`,
          shortDescription: `Join ${employer.employerEmployerProfile.companyName} as a ${jobTemplate.title}`,
          location: isRemote ? 'Remote - UK' : randomElement(LOCATIONS),
          employmentType: jobTemplate.type,
          isRemote,
          salaryMin: jobTemplate.salaryMin,
          salaryMax: jobTemplate.salaryMax,
          currency: jobTemplate.type === 'CONTRACT' ? 'GBP/day' : 'GBP/year',
          seniority: jobTemplate.seniority,
          specialism: 'Project Management',
          isFeatured: Math.random() > 0.7,
          isUrgent: Math.random() > 0.8,
          createdAt: randomDate(60),
        }
      });
      
      jobs.push(job);
      console.log(`  ✓ Created job: ${job.title} at ${employer.employerEmployerProfile.companyName}`);
    }
  }

  // Create candidate users and profiles
  console.log('\nCreating candidates...');
  const candidates = [];
  
  for (const candidate of CANDIDATE_NAMES) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const firstName = candidate.fullName.split(' ')[0].toLowerCase();
    const lastName = candidate.fullName.split(' ')[1].toLowerCase();
    const email = `${firstName}.${lastName}@example.com`;
    
    const yearsExp = randomInt(3, 15);
    const skills = randomSkills(randomInt(8, 15));
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CANDIDATE',
        emailVerified: new Date(),
        candidateCandidateProfile: {
          create: {
            fullName: candidate.fullName,
            jobTitle: candidate.jobTitle,
            summary: `Experienced ${candidate.jobTitle} with ${yearsExp} years in the industry. Passionate about delivering successful projects and driving digital transformation.`,
            yearsExperience: yearsExp,
            sector: 'Technology',
            availability: Math.random() > 0.7 ? 'AVAILABLE_IMMEDIATE' : 'AVAILABLE_2_WEEKS',
            dayRate: randomInt(400, 800),
            salaryExpectation: randomInt(50000, 100000),
            location: randomElement(LOCATIONS),
            email,
            phone: `+44 7${randomInt(400, 999)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
            remotePreference: randomElement(['remote', 'hybrid', 'onsite']),
            employmentType: randomElement(['contract', 'permanent', 'both']),
            rightToWork: 'UK_CITIZEN',
            linkedinUrl: `https://linkedin.com/in/${firstName}${lastName}`,
            isPublic: true,
            showSalary: Math.random() > 0.5,
            skills: {
              create: skills.map(skill => ({
                name: skill,
                proficiency: randomElement(['Intermediate', 'Advanced', 'Expert']),
                category: skill.includes('Management') ? 'Management' : 'Technical'
              }))
            },
            experiences: {
              create: Array.from({ length: randomInt(2, 4) }, (_, i) => {
                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - (i + 1) * 2);
                const endDate = i === 0 ? null : new Date(startDate);
                if (endDate) endDate.setFullYear(endDate.getFullYear() + randomInt(1, 3));
                
                return {
                  jobTitle: randomElement(['Project Manager', 'Senior PM', 'Programme Manager', 'Delivery Lead']),
                  company: randomElement(['Tech Corp', 'Digital Ltd', 'Innovation Partners', 'Cloud Systems']),
                  location: randomElement(LOCATIONS),
                  startDate,
                  endDate,
                  current: i === 0,
                  description: 'Led multiple successful projects across diverse portfolios',
                  achievements: `Delivered £${randomInt(1, 10)}M+ in project value`,
                  teamSize: `${randomInt(5, 50)} people`,
                };
              })
            },
            education: {
              create: {
                institution: randomElement(['University of London', 'Manchester University', 'Oxford', 'Cambridge']),
                degree: randomElement(['BSc Computer Science', 'BA Business Management', 'MSc Project Management']),
                fieldOfStudy: randomElement(['Computer Science', 'Business', 'Engineering']),
                grade: randomElement(['First Class', '2:1', 'Merit', 'Distinction']),
                startDate: new Date('2005-09-01'),
                endDate: new Date('2008-06-01'),
              }
            },
            certifications: {
              create: [
                {
                  title: randomElement(['PMP', 'Prince2', 'Agile Certified Practitioner', 'Scrum Master']),
                  issuingBody: randomElement(['PMI', 'Axelos', 'Scrum Alliance']),
                  issueDate: randomDate(1000),
                }
              ]
            }
          }
        }
      },
      include: { candidateCandidateProfile: true }
    });
    
    candidates.push(user);
    console.log(`  ✓ Created candidate: ${candidate.fullName}`);
  }

  // Create applications
  console.log('\nCreating applications...');
  const statuses = ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED'];
  let applicationCount = 0;
  
  for (const job of jobs) {
    const numApplications = randomInt(3, 8);
    const applicantsForJob = [...candidates].sort(() => 0.5 - Math.random()).slice(0, numApplications);
    
    for (const candidate of applicantsForJob) {
      const status = randomElement(statuses);
      const createdAt = randomDate(30);
      const viewed = Math.random() > 0.3;
      
      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.candidateCandidateProfile.id,
          coverLetter: `I am writing to express my strong interest in the ${job.title} position. With ${candidate.candidateCandidateProfile.yearsExperience} years of experience, I believe I would be a great fit for your team.`,
          availability: candidate.candidateCandidateProfile.availability,
          status,
          matchScore: randomInt(65, 98),
          yearsExp: candidate.candidateCandidateProfile.yearsExperience,
          location: candidate.candidateCandidateProfile.location,
          viewedByEmployerAt: viewed ? randomDate(20) : null,
          createdAt,
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: 'APPLIED',
              changedByUserId: candidate.id,
              createdAt,
            }
          }
        }
      });
      
      // Add status history for non-applied statuses
      if (status !== 'APPLIED') {
        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: 'APPLIED',
            toStatus: status,
            note: status === 'REJECTED' ? 'Not suitable for this role' : `Moved to ${status}`,
            changedByUserId: (await prisma.user.findFirst({ where: { employerEmployerProfile: { id: job.employerId } } })).id,
            createdAt: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * randomInt(1, 5)),
          }
        });
      }
      
      applicationCount++;
    }
    
    console.log(`  ✓ Created ${numApplications} applications for: ${job.title}`);
  }

  // Create some conversations and messages
  console.log('\nCreating conversations and messages...');
  const applicationsWithMessages = await prisma.application.findMany({
    where: {
      status: { in: ['SHORTLISTED', 'INTERVIEW'] }
    },
    take: 8
  });
  
  for (const app of applicationsWithMessages) {
    const job = await prisma.job.findUnique({ where: { id: app.jobId } });
    const employerUser = await prisma.user.findFirst({
      where: { employerEmployerProfile: { id: job.employerId } }
    });
    const candidateUser = await prisma.user.findFirst({
      where: { candidateCandidateProfile: { id: app.candidateId } }
    });
    
    const conversation = await prisma.conversation.create({
      data: {
        jobId: job.id,
        employerId: job.employerId,
        candidateId: app.candidateId,
        createdAt: randomDate(15),
        messages: {
          create: [
            {
              senderUserId: employerUser.id,
              receiverUserId: candidateUser.id,
              text: `Hi! Thanks for applying to our ${job.title} position. We'd like to schedule an interview with you.`,
              createdAt: randomDate(14),
              readAt: randomDate(13),
            },
            {
              senderUserId: candidateUser.id,
              receiverUserId: employerUser.id,
              text: `Thank you for considering my application! I'd be happy to discuss the role. I'm available next week.`,
              createdAt: randomDate(12),
              readAt: randomDate(11),
            },
            {
              senderUserId: employerUser.id,
              receiverUserId: candidateUser.id,
              text: `Great! I'll send you a calendar invite for Tuesday at 2pm. Looking forward to meeting you.`,
              createdAt: randomDate(10),
              readAt: Math.random() > 0.3 ? randomDate(9) : null,
            }
          ]
        }
      }
    });
    
    console.log(`  ✓ Created conversation for job: ${job.title}`);
  }

  console.log('\n✅ Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${employers.length} employers created`);
  console.log(`   - ${jobs.length} jobs created`);
  console.log(`   - ${candidates.length} candidates created`);
  console.log(`   - ${applicationCount} applications created`);
  console.log(`   - ${applicationsWithMessages.length} conversations created`);
  console.log(`\n🔑 Login credentials (password for all: password123):`);
  console.log(`   Employers:`);
  employers.forEach(e => console.log(`     - ${e.email}`));
  console.log(`   Candidates:`);
  candidates.slice(0, 5).forEach(c => console.log(`     - ${c.email}`));
  console.log(`     ... and ${candidates.length - 5} more candidates`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
