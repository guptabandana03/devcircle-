const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devcircle');
    console.log('Seed: Connected to MongoDB.');

    // Clear existing collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Question.deleteMany({});
    await Answer.deleteMany({});
    console.log('Seed: Wiped previous data.');

    // 1. Create Mock users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = await User.create([
      {
        username: 'linus',
        email: 'linus@linux.org',
        password: passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=linus',
        bio: 'I do talk code, not empty descriptions. Creator of Git and Linux kernel architectures.',
        skills: ['C', 'Assembly', 'Git', 'Kernel', 'OS-Design'],
        githubUrl: 'https://github.com/torvalds'
      },
      {
        username: 'dan',
        email: 'dan@react.dev',
        password: passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=dan',
        bio: 'Co-author of Redux and Create React App. Currently explaining React Server Components.',
        skills: ['React', 'Redux', 'Javascript', 'Nextjs', 'CSS'],
        githubUrl: 'https://github.com/gaearon'
      },
      {
        username: 'grace',
        email: 'grace@navy.mil',
        password: passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=grace',
        bio: 'Rear Admiral of US Navy. Inventor of the first compiler tools and pioneer of COBOL.',
        skills: ['COBOL', 'Compilers', 'Assembly', 'Fortran'],
        githubUrl: 'https://github.com/gracehopper'
      }
    ]);

    const [linus, dan, grace] = users;
    console.log('Seed: Created 3 developers profiles.');

    // Establish follows relationships (Linus follows Dan, Dan follows Grace & Linus, Grace follows Linus)
    linus.following.push(dan._id);
    dan.followers.push(linus._id);

    dan.following.push(grace._id, linus._id);
    grace.followers.push(dan._id);
    linus.followers.push(dan._id);

    grace.following.push(linus._id);
    linus.followers.push(grace._id);

    await linus.save();
    await dan.save();
    await grace.save();
    console.log('Seed: Linked follow networks.');

    // 2. Create posts
    const posts = await Post.create([
      {
        author: linus._id,
        text: 'I am officially declaring Git 3.0 scoping sessions open. We need faster ref-parsing loops and clean support for larger blob arrays. Let us keep it pure C.',
        likes: [dan._id, grace._id]
      },
      {
        author: dan._id,
        text: 'Just finished drafting a new visual tutorial explaining why React Server Components do not compile down to client bundles. Let me know your thoughts!',
        likes: [linus._id]
      },
      {
        author: grace._id,
        text: 'People forget that the greatest bug in early calculators was literal — a moth stuck in a relay switch of the Harvard Mark II. Clean your hardware, developers!',
        likes: [dan._id, linus._id]
      }
    ]);

    console.log('Seed: Created posts.');

    // Add comments to Linus's post
    await Comment.create([
      {
        post: posts[0]._id,
        author: dan._id,
        text: 'Sounds awesome, Linus. Can we get better standard binding links for Javascript engines in the core CLI?'
      },
      {
        post: posts[0]._id,
        author: linus._id,
        text: '@dan No. Write a separate wrapper. Keep the core tools clean.'
      }
    ]);

    // 3. Create Technical Q&As
    const question1 = await Question.create({
      author: linus._id,
      title: 'How to clean socket file locks safely in Unix C on crash?',
      content: 'I have a daemon listening on a local unix domain socket. If the process is killed abruptly, the socket lock file persists in /var/run, making bind() fail on immediate boot. What is the standard clean sequence?',
      tags: ['c', 'unix', 'sockets', 'systems']
    });

    const answer1 = await Answer.create({
      question: question1._id,
      author: grace._id,
      content: 'You should listen to termination interrupts (SIGTERM, SIGINT) and unlink the socket file pathway inside the handler. As a fallback on start, check if lock is active by attempting connect(), if that fails with ECONNREFUSED, you can safely unlink() it before bind().',
      upvotes: [linus._id, dan._id],
      isAccepted: true
    });

    question1.acceptedAnswer = answer1._id;
    await question1.save();

    const question2 = await Question.create({
      author: dan._id,
      title: 'Optimal setup for synchronizing deep Redux states across Socket.io events?',
      content: 'I have a multi-player board workspace where changes need real-time syncing. Should I dispatch every action through socket triggers, or aggregate state patches using deep diff selectors?',
      tags: ['redux', 'socketio', 'react', 'javascript']
    });

    await Answer.create({
      question: question2._id,
      author: linus._id,
      content: 'Do not sync actions, sync states. Dispatches are high frequency and network delays will cause out-of-order race states. Pipe unified patch buffers periodically.',
      upvotes: [dan._id]
    });

    console.log('Seed: Created Q&A records.');
    console.log('Database seeded successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

// If executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
