import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Project from '../models/Project.js';
import Note from '../models/Note.js';
import File from '../models/File.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabsphere';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB');

    // Remove existing demo seed records (scoped only to demo users)
    const demoEmails = [
      'demo_lead@collabsphere.dev',
      'demo_engineer@collabsphere.dev',
      'demo_stakeholder@collabsphere.dev'
    ];
    const existingDemoUsers = await User.find({ email: { $in: demoEmails } });
    const demoUserIds = existingDemoUsers.map((u) => u._id);

    if (demoUserIds.length > 0) {
      const demoProjects = await Project.find({ owner: { $in: demoUserIds } });
      const demoProjectIds = demoProjects.map((p) => p._id);

      await Note.deleteMany({ project: { $in: demoProjectIds } });
      await File.deleteMany({ project: { $in: demoProjectIds } });
      await Activity.deleteMany({ project: { $in: demoProjectIds } });
      await Notification.deleteMany({ recipient: { $in: demoUserIds } });
      await Project.deleteMany({ _id: { $in: demoProjectIds } });
      await User.deleteMany({ _id: { $in: demoUserIds } });
      console.log('[Seeder] Cleaned previous demo records');
    }

    // 1. Create Demo Users
    const lead = await User.create({
      name: 'Dr. Elena Rostova',
      username: 'elena_lead',
      email: 'demo_lead@collabsphere.dev',
      password: 'DemoPassword123!',
      bio: 'Principal Distributed Systems Architect & Open Source Maintainer',
      githubUrl: 'https://github.com/elena-dist-sys',
      skills: ['Distributed Systems', 'Node.js', 'Raft', 'MongoDB', 'React'],
      role: 'admin'
    });

    const dev = await User.create({
      name: 'Marcus Vance',
      username: 'marcus_dev',
      email: 'demo_engineer@collabsphere.dev',
      password: 'DemoPassword123!',
      bio: 'Staff Backend & Cloud Infrastructure Engineer',
      githubUrl: 'https://github.com/marcus-vance',
      skills: ['Express', 'Python', 'Docker', 'Kubernetes', 'WebSockets'],
      role: 'user'
    });

    const stakeholder = await User.create({
      name: 'Sophia Patel',
      username: 'sophia_viewer',
      email: 'demo_stakeholder@collabsphere.dev',
      password: 'DemoPassword123!',
      bio: 'VP of Engineering & Product Stakeholder',
      githubUrl: 'https://github.com/sophia-patel',
      skills: ['System Architecture', 'Agile', 'Product Strategy'],
      role: 'user'
    });

    console.log('[Seeder] Created 3 Demo Users');

    // 2. Create Project 1: Distributed Consensus Mesh
    const project1 = await Project.create({
      name: 'Distributed Consensus Mesh (Raft Protocol)',
      description: 'Fault-tolerant distributed log replication and leader election engine implementing the Raft consensus algorithm with state machine replication.',
      visibility: 'public',
      status: 'active',
      goals: '1. Maintain quorum consistency under network partitions.\n2. Achieve sub-10ms leader election recovery.\n3. Implement snapshotting and log compaction.',
      technologies: ['Node.js', 'Express', 'React', 'MongoDB', 'Docker', 'WebSockets'],
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days in future
      owner: lead._id,
      members: [
        { user: lead._id, role: 'OWNER', joinedAt: new Date(Date.now() - 10 * 86400000) },
        { user: dev._id, role: 'ADMIN', joinedAt: new Date(Date.now() - 8 * 86400000) },
        { user: stakeholder._id, role: 'VIEWER', joinedAt: new Date(Date.now() - 5 * 86400000) }
      ],
      publicShare: {
        enabled: true,
        shareToken: 'demo-consensus-mesh-preview-token-2026'
      }
    });

    // 3. Create Markdown Notes for Project 1
    const note1 = await Note.create({
      project: project1._id,
      author: lead._id,
      lastEditedBy: lead._id,
      title: 'Leader Election & Heartbeat Protocol Spec',
      category: 'architecture',
      tags: ['raft', 'consensus', 'heartbeat', 'spec'],
      content: `# Raft Leader Election Specification

## 1. Overview
The cluster consists of $2F + 1$ nodes ensuring fault tolerance against up to $F$ node failures.
Each node transitions between three primary states:
- **Follower**: Responds to incoming RPCs from candidate or leader nodes.
- **Candidate**: Transitions here upon election timeout and requests votes.
- **Leader**: Manages state replication and sends periodic heartbeats.

\`\`\`javascript
// Election Timer Initialization
function resetElectionTimeout() {
  const randomizedTimeout = 150 + Math.floor(Math.random() * 150); // 150-300ms
  clearTimeout(node.electionTimer);
  node.electionTimer = setTimeout(() => {
    startElection(node);
  }, randomizedTimeout);
}
\`\`\`

## 2. Vote Request Invariants
A candidate only receives a vote if:
1. The candidate's term is greater than or equal to the receiver's term.
2. The receiver has not yet voted in this term (\`votedFor == null\` or \`votedFor == candidateId\`).
3. The candidate's log is at least as up-to-date as the receiver's log.

> **Note**: Split votes resolve naturally through randomized election timeout jitter.`
    });

    const note2 = await Note.create({
      project: project1._id,
      author: dev._id,
      lastEditedBy: dev._id,
      title: 'Log Replication & Commit Index Guarantees',
      category: 'api',
      tags: ['replication', 'commit-index', 'quorum'],
      content: `# Log Replication API & State Transitions

## AppendEntries RPC Contract
The leader issues periodic \`AppendEntries\` heartbeats and log entry streams.

\`\`\`json
{
  "term": 4,
  "leaderId": "node-us-east-1",
  "prevLogIndex": 104,
  "prevLogTerm": 3,
  "entries": [
    { "index": 105, "term": 4, "command": "SET cluster.mode = READ_WRITE" }
  ],
  "leaderCommit": 104
}
\`\`\`

### Verification Algorithm
When node receives AppendEntries:
1. Reply false if \`term < currentTerm\`.
2. Reply false if log doesn't contain entry at \`prevLogIndex\` matching \`prevLogTerm\`.
3. If existing entry conflicts with a new one, delete existing entry and following.
4. Append any new entries not already in the log.
5. If \`leaderCommit > commitIndex\`, set \`commitIndex = min(leaderCommit, index of last new entry)\`.`
    });

    const note3 = await Note.create({
      project: project1._id,
      author: dev._id,
      lastEditedBy: dev._id,
      title: 'Network Partition & Quorum Recovery Guide',
      category: 'guide',
      tags: ['recovery', 'partition', 'resilience'],
      content: `# Network Partition Recovery Protocol

In the event of an asymmetric split-brain partition (e.g. 3 nodes in Partition A vs 2 nodes in Partition B):
1. **Partition A (Quorum)** continues accepting client writes.
2. **Partition B (Minority)** cannot achieve majority quorum ($> 50\\%$) and rejects client commit transactions.
3. Upon network healing, nodes in Partition B truncate uncommitted logs and synchronize with Partition A's leader.`
    });

    // 4. Create Seed Files
    const sampleCode = `// Raft Node State Machine Engine
export class RaftNode {
  constructor(id, peers = []) {
    this.id = id;
    this.peers = peers;
    this.currentTerm = 0;
    this.votedFor = null;
    this.log = [];
    this.commitIndex = 0;
    this.state = 'FOLLOWER';
  }

  requestVote(candidateTerm, candidateId) {
    if (candidateTerm > this.currentTerm) {
      this.currentTerm = candidateTerm;
      this.state = 'FOLLOWER';
      this.votedFor = candidateId;
      return { voteGranted: true, term: this.currentTerm };
    }
    return { voteGranted: false, term: this.currentTerm };
  }
}
`;
    const storedFileName = `file-demo-raft-node-${Date.now()}.js`;
    const fullDiskPath = path.resolve(uploadDir, storedFileName);
    fs.writeFileSync(fullDiskPath, sampleCode, 'utf8');

    const file1 = await File.create({
      project: project1._id,
      uploader: lead._id,
      originalName: 'raft_node_state_machine.js',
      storedName: storedFileName,
      filePath: fullDiskPath,
      mimeType: 'text/javascript',
      extension: '.js',
      size: Buffer.byteLength(sampleCode, 'utf8'),
      category: 'code'
    });

    // 5. Seed Activities
    await Activity.create([
      {
        project: project1._id,
        user: lead._id,
        action: 'created_project',
        entityType: 'project',
        entityId: project1._id,
        details: { name: project1.name }
      },
      {
        project: project1._id,
        user: lead._id,
        action: 'added_member',
        entityType: 'member',
        entityId: dev._id,
        details: { memberName: dev.name, role: 'ADMIN' }
      },
      {
        project: project1._id,
        user: lead._id,
        action: 'created_note',
        entityType: 'note',
        entityId: note1._id,
        details: { title: note1.title, category: note1.category }
      },
      {
        project: project1._id,
        user: dev._id,
        action: 'created_note',
        entityType: 'note',
        entityId: note2._id,
        details: { title: note2.title, category: note2.category }
      },
      {
        project: project1._id,
        user: dev._id,
        action: 'created_note',
        entityType: 'note',
        entityId: note3._id,
        details: { title: note3.title, category: note3.category }
      },
      {
        project: project1._id,
        user: lead._id,
        action: 'uploaded_file',
        entityType: 'file',
        entityId: file1._id,
        details: { fileName: file1.originalName, category: file1.category }
      },
      {
        project: project1._id,
        user: dev._id,
        action: 'ai_request',
        entityType: 'ai',
        details: { tool: 'explain_code', language: 'javascript' }
      },
      {
        project: project1._id,
        user: lead._id,
        action: 'public_share_toggled',
        entityType: 'project',
        entityId: project1._id,
        details: { enabled: true }
      }
    ]);

    // 6. Seed Notifications
    await Notification.create([
      {
        recipient: dev._id,
        sender: lead._id,
        project: project1._id,
        type: 'member_added',
        title: `Added to project: ${project1.name}`,
        message: `${lead.name} added you to the project "${project1.name}" as an ADMIN.`,
        link: `/projects/${project1._id}`,
        read: false
      },
      {
        recipient: stakeholder._id,
        sender: lead._id,
        project: project1._id,
        type: 'member_added',
        title: `Added to project: ${project1.name}`,
        message: `${lead.name} added you to the project "${project1.name}" as a VIEWER.`,
        link: `/projects/${project1._id}`,
        read: true
      }
    ]);

    console.log('\n======================================================');
    console.log('       DEMO SEED DATA POPULATED SUCCESSFULLY!         ');
    console.log('======================================================');
    console.log('Demo Accounts for Instant Evaluation:');
    console.log('1. Lead (OWNER):');
    console.log('   Email:    demo_lead@collabsphere.dev');
    console.log('   Username: elena_lead');
    console.log('   Password: DemoPassword123!');
    console.log('2. Engineer (ADMIN):');
    console.log('   Email:    demo_engineer@collabsphere.dev');
    console.log('   Username: marcus_dev');
    console.log('   Password: DemoPassword123!');
    console.log('3. Stakeholder (VIEWER):');
    console.log('   Email:    demo_stakeholder@collabsphere.dev');
    console.log('   Username: sophia_viewer');
    console.log('   Password: DemoPassword123!');
    console.log('\nPublic Share Link:');
    console.log(`   http://localhost:5173/share/${project1.publicShare.shareToken}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
