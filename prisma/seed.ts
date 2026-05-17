import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

const questions = [
  // ── CCNA EASY (5 points) ──
  { category: "CCNA", difficulty: "Easy", question: "What does ARP stand for?", choices: ["Address Resolution Protocol", "Advanced Routing Protocol", "Access Request Protocol", "Automatic Relay Protocol"], answer: 0, points: 5 },
  { category: "CCNA", difficulty: "Easy", question: "Which protocol uses port 53?", choices: ["HTTP", "FTP", "DNS", "SMTP"], answer: 2, points: 5 },
  { category: "CCNA", difficulty: "Easy", question: "What is the default VLAN on a Cisco switch?", choices: ["VLAN 0", "VLAN 1", "VLAN 10", "VLAN 100"], answer: 1, points: 5 },
  { category: "CCNA", difficulty: "Easy", question: "Which protocol provides automatic IP address assignment?", choices: ["DNS", "DHCP", "NAT", "SNMP"], answer: 1, points: 5 },
  { category: "CCNA", difficulty: "Easy", question: "What does NAT stand for?", choices: ["Network Address Translation", "Node Access Table", "Network Access Token", "Node Address Transfer"], answer: 0, points: 5 },
  
  // ── CCNA MEDIUM (10 points) ──
  { category: "CCNA", difficulty: "Medium", question: "What is the default administrative distance of OSPF?", choices: ["90", "110", "120", "115"], answer: 1, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "Which layer of the OSI model is responsible for routing?", choices: ["Layer 2", "Layer 3", "Layer 4", "Layer 1"], answer: 1, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "What is the subnet mask for /24?", choices: ["255.255.0.0", "255.255.255.0", "255.0.0.0", "255.255.255.128"], answer: 1, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "Which command shows the routing table on a Cisco router?", choices: ["show ip route", "show route table", "display ip route", "ip route show"], answer: 0, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "What does VLAN stand for?", choices: ["Virtual Local Area Network", "Variable LAN", "Virtual Link Access Node", "Verified LAN"], answer: 0, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "Which STP port state forwards traffic and learns MAC addresses?", choices: ["Blocking", "Listening", "Learning", "Forwarding"], answer: 3, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "What is the maximum transmission unit (MTU) for Ethernet?", choices: ["512 bytes", "1024 bytes", "1500 bytes", "9000 bytes"], answer: 2, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "Which routing protocol uses bandwidth and delay as its metric?", choices: ["RIP", "OSPF", "EIGRP", "BGP"], answer: 2, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "Which port does HTTPS use by default?", choices: ["80", "8080", "443", "8443"], answer: 2, points: 10 },
  { category: "CCNA", difficulty: "Medium", question: "What is the loopback address in IPv4?", choices: ["192.168.0.1", "10.0.0.1", "127.0.0.1", "172.16.0.1"], answer: 2, points: 10 },
  
  // ── CCNA HARD (20 points) ──
  { category: "CCNA", difficulty: "Hard", question: "What is the wildcard mask for 255.255.255.0?", choices: ["0.0.0.255", "255.0.0.0", "0.255.255.255", "255.255.255.0"], answer: 0, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "What does CDP stand for in Cisco networking?", choices: ["Cisco Discovery Protocol", "Core Data Protocol", "Connection Detection Protocol", "Cisco Data Plane"], answer: 0, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "Which mode must you be in to configure a router interface?", choices: ["User EXEC", "Privileged EXEC", "Global config", "Interface config"], answer: 3, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "What is the default administrative distance of RIP?", choices: ["90", "100", "110", "120"], answer: 3, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "Which command saves the running config to NVRAM?", choices: ["copy startup-config running-config", "write memory", "save config", "copy run flash"], answer: 1, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "What does ICMP stand for?", choices: ["Internet Control Message Protocol", "Internal Core Management Protocol", "IP Control Message Protocol", "Internet Core Monitoring Protocol"], answer: 0, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "Which layer handles MAC addresses?", choices: ["Layer 1", "Layer 2", "Layer 3", "Layer 4"], answer: 1, points: 20 },
  { category: "CCNA", difficulty: "Hard", question: "Which protocol resolves IP addresses to MAC addresses?", choices: ["DNS", "ARP", "RARP", "DHCP"], answer: 1, points: 20 },

  // ── AWS EASY (5 points) ──
  { category: "AWS", difficulty: "Easy", question: "What does EC2 stand for?", choices: ["Elastic Compute Cloud", "Extended Cloud Computing", "Enterprise Control Center", "Elastic Container Cluster"], answer: 0, points: 5 },
  { category: "AWS", difficulty: "Easy", question: "What is S3 primarily used for?", choices: ["Running virtual machines", "Object storage", "DNS management", "Load balancing"], answer: 1, points: 5 },
  { category: "AWS", difficulty: "Easy", question: "What does IAM stand for?", choices: ["Internet Access Manager", "Identity and Access Management", "Internal Authorization Module", "Instance Access Mode"], answer: 1, points: 5 },
  { category: "AWS", difficulty: "Easy", question: "What does VPC stand for?", choices: ["Virtual Private Cloud", "Virtual Public Cluster", "Verified Private Connection", "Variable Processing Core"], answer: 0, points: 5 },
  { category: "AWS", difficulty: "Easy", question: "Which AWS service is used for sending emails?", choices: ["SNS", "SQS", "SES", "SMS"], answer: 2, points: 5 },
  
  // ── AWS MEDIUM (10 points) ──
  { category: "AWS", difficulty: "Medium", question: "Which AWS service provides managed relational databases?", choices: ["DynamoDB", "S3", "RDS", "ElastiCache"], answer: 2, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "Which service is AWS's serverless compute offering?", choices: ["EC2", "ECS", "Lambda", "Fargate"], answer: 2, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "Which AWS service distributes traffic across multiple EC2 instances?", choices: ["Route 53", "CloudFront", "Elastic Load Balancer", "Auto Scaling"], answer: 2, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "Which service is used for a managed NoSQL database?", choices: ["RDS", "Redshift", "DynamoDB", "Aurora"], answer: 2, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "What service does AWS use for DNS management?", choices: ["CloudFront", "Route 53", "Direct Connect", "VPN Gateway"], answer: 1, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "Which AWS service helps you monitor resources and set alarms?", choices: ["CloudTrail", "Config", "CloudWatch", "Trusted Advisor"], answer: 2, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "What is the max size of a single S3 object?", choices: ["5 GB", "50 GB", "500 GB", "5 TB"], answer: 3, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "Which service provides a content delivery network (CDN)?", choices: ["CloudFront", "CloudTrail", "Direct Connect", "S3 Transfer Acceleration"], answer: 0, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "What is an AWS Availability Zone?", choices: ["A geographic region", "An isolated data center within a region", "A CDN edge location", "A billing unit"], answer: 1, points: 10 },
  { category: "AWS", difficulty: "Medium", question: "What does EBS stand for?", choices: ["Elastic Block Store", "Extended Backup Service", "Elastic Bandwidth Scale", "Enterprise Block Storage"], answer: 0, points: 10 },
  
  // ── AWS HARD (20 points) ──
  { category: "AWS", difficulty: "Hard", question: "What is the AWS region closest to North Africa?", choices: ["eu-west-1", "eu-south-1", "me-south-1", "af-south-1"], answer: 3, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "Which S3 storage class is cheapest for rarely accessed data?", choices: ["S3 Standard", "S3 Intelligent-Tiering", "S3 Glacier", "S3 One Zone-IA"], answer: 2, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "What does Auto Scaling help with?", choices: ["Reducing storage costs", "Automatically adjusting compute capacity", "Managing DNS records", "Encrypting data"], answer: 1, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "Which service provides a message queue?", choices: ["SNS", "SQS", "SES", "Kinesis"], answer: 1, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "What is the free tier EC2 instance type?", choices: ["t2.small", "t2.micro", "t3.micro", "t3.small"], answer: 1, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "Which service logs all API calls in your AWS account?", choices: ["CloudWatch", "CloudTrail", "Config", "GuardDuty"], answer: 1, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "What does ECS stand for?", choices: ["Elastic Compute Service", "Elastic Container Service", "Extended Cloud Storage", "Enterprise Control System"], answer: 1, points: 20 },
  { category: "AWS", difficulty: "Hard", question: "Which IAM entity represents a set of permissions?", choices: ["User", "Group", "Role", "Policy"], answer: 3, points: 20 },

  // ── PYTHON EASY (5 points) ──
  { category: "Python", difficulty: "Easy", question: "What is the correct file extension for Python files?", choices: [".pyth", ".pt", ".py", ".p"], answer: 2, points: 5 },
  { category: "Python", difficulty: "Easy", question: "What is the output of print(2**3)?", choices: ["6", "8", "9", "5"], answer: 1, points: 5 },
  { category: "Python", difficulty: "Easy", question: "Which keyword is used to define a function?", choices: ["function", "def", "define", "func"], answer: 1, points: 5 },
  { category: "Python", difficulty: "Easy", question: "What does 'len()' do?", choices: ["Returns length", "Returns last element", "Converts to lowercase", "Rounds number"], answer: 0, points: 5 },
  { category: "Python", difficulty: "Easy", question: "Which data type is immutable?", choices: ["List", "Dictionary", "Tuple", "Set"], answer: 2, points: 5 },
  
  // ── PYTHON MEDIUM (10 points) ──
  { category: "Python", difficulty: "Medium", question: "What does 'pip' stand for?", choices: ["Python Install Program", "Pip Installs Packages", "Preferred Installer Program", "Python Index Package"], answer: 1, points: 10 },
  { category: "Python", difficulty: "Medium", question: "Which library is used for data analysis?", choices: ["Django", "Flask", "Pandas", "Requests"], answer: 2, points: 10 },
  { category: "Python", difficulty: "Medium", question: "What does 'if __name__ == '__main__'' do?", choices: ["Checks if script is run directly", "Imports a module", "Creates main function", "Defines a class"], answer: 0, points: 10 },
  { category: "Python", difficulty: "Medium", question: "Which of these is NOT a Python loop?", choices: ["for", "while", "do-while", "None"], answer: 2, points: 10 },
  { category: "Python", difficulty: "Medium", question: "How do you start a comment in Python?", choices: ["//", "/*", "#", "<!--"], answer: 2, points: 10 },
  
  // ── PYTHON HARD (20 points) ──
  { category: "Python", difficulty: "Hard", question: "What is list comprehension used for?", choices: ["Creating lists concisely", "Deleting lists", "Sorting lists", "Copying lists"], answer: 0, points: 20 },
  { category: "Python", difficulty: "Hard", question: "What is a decorator?", choices: ["Function that modifies another function", "A class method", "A variable decorator", "An import statement"], answer: 0, points: 20 },
  { category: "Python", difficulty: "Hard", question: "What is a generator?", choices: ["Function that yields values", "A list of values", "A class constructor", "An import tool"], answer: 0, points: 20 },
  { category: "Python", difficulty: "Hard", question: "What does 'self' represent in a class?", choices: ["The instance itself", "The class name", "A parameter", "A return value"], answer: 0, points: 20 },
  { category: "Python", difficulty: "Hard", question: "What is the purpose of '__init__'?", choices: ["Constructor method", "Destructor method", "Import method", "Delete method"], answer: 0, points: 20 },
]

async function main() {
  console.log("Seeding questions with difficulty levels...")
  const categories = Array.from(new Set(questions.map((q) => q.category))).map((name) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    description: `Questions ${name}`,
    isActive: true,
  }))

  await prisma.category.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.category.createMany({ data: categories })
  await prisma.question.createMany({ data: questions })
  console.log(`Seeded ${questions.length} questions with Easy, Medium, Hard levels.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())