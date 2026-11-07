import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { User } from '../modules/auth/entities/user.entity';
import { Patient } from '../modules/assessments/entities/patient.entity';
import { Assessment } from '../modules/assessments/entities/assessment.entity';
import { Conversation } from '../modules/chat/entities/conversations.entity';
import { Message, SenderType } from '../modules/chat/entities/messages.entity';
import {
  MessageReaction,
  ReactionSenderType,
} from '../modules/chat/entities/message-reaction.entity';
import {
  PatientNotification,
  NotificationType,
} from '../modules/patient-notifications/entities/patient-notification.entity';
import { StaffNotification } from '../modules/staff-notifications/entities/staff-notification.entity';
import { StickerPack } from '../modules/stickers/entities/sticker-pack.entity';
import { Sticker } from '../modules/stickers/entities/sticker.entity';

// Helper to compute date N days ago with optional hour/minute offset
function getRelativeDate(daysAgo: number, hours = 9, minutes = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// Medical & rehabilitation images for realistic knee chat demo
const REHAB_IMAGES = {
  xray: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
  swelling:
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
  quad_exercise:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
  stretching:
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
  clinic_visit:
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  ice_wrap:
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80',
};

async function seed() {
  console.log(
    '🚀 Starting 30-Day Rich Database Seed for Knee Rehab Program...',
  );
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const userRepo = dataSource.getRepository(User);
    const patientRepo = dataSource.getRepository(Patient);
    const assessmentRepo = dataSource.getRepository(Assessment);
    const convRepo = dataSource.getRepository(Conversation);
    const messageRepo = dataSource.getRepository(Message);
    const reactionRepo = dataSource.getRepository(MessageReaction);
    const patientNotifRepo = dataSource.getRepository(PatientNotification);
    const staffNotifRepo = dataSource.getRepository(StaffNotification);
    const packRepo = dataSource.getRepository(StickerPack);
    const stickerRepo = dataSource.getRepository(Sticker);

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    // =========================================================================
    // 1. CHECK STICKER PACKS IN DATABASE
    // =========================================================================
    console.log('📦 Reading Sticker Packs from Database...');
    const stickerPackCount = await packRepo.count();
    console.log(`ℹ️ Current sticker packs in DB: ${stickerPackCount}`);

    const allDbStickers = await stickerRepo.find({ take: 10 });
    const STICKER_URLS = {
      thumbs_up: allDbStickers[0]?.url || '',
      clap: allDbStickers[1]?.url || allDbStickers[0]?.url || '',
      heart: allDbStickers[2]?.url || allDbStickers[0]?.url || '',
      star: allDbStickers[3]?.url || allDbStickers[0]?.url || '',
      hug: allDbStickers[4]?.url || allDbStickers[0]?.url || '',
    };

    // =========================================================================
    // 2. SEED STAFF USERS (DOCTORS & ADMINS)
    // =========================================================================
    console.log('👨‍⚕️ Seeding Staff Users...');
    const staffMembersData = [
      {
        email: 'doctor@adelaidekneeclinic.com',
        role: 'doctor',
        isActive: true,
        createdAt: getRelativeDate(30, 8, 0),
      },
      {
        email: 'physio@adelaidekneeclinic.com',
        role: 'doctor',
        isActive: true,
        createdAt: getRelativeDate(30, 8, 30),
      },
      {
        email: 'admin@akc.com',
        role: 'admin',
        isActive: true,
        createdAt: getRelativeDate(30, 9, 0),
      },
    ];

    const staffMap = new Map<string, User>();
    for (const s of staffMembersData) {
      let user = await userRepo.findOne({ where: { email: s.email } });
      if (!user) {
        user = userRepo.create({
          ...s,
          passwordHash: defaultPasswordHash,
        });
        await userRepo.save(user);
      }
      staffMap.set(s.email, user);
    }

    const primaryDoctor = staffMap.get('doctor@adelaidekneeclinic.com')!;
    const physio = staffMap.get('physio@adelaidekneeclinic.com')!;

    // =========================================================================
    // 3. SEED PATIENTS (8 DETAILED PERSONAS OVER 30 DAYS)
    // =========================================================================
    console.log('🧑‍🤝‍🧑 Seeding Patients & Patient Accounts...');
    const patientsData = [
      {
        firstName: 'John',
        lastName: 'Miller',
        email: 'john.miller@example.com',
        mobile: '+61 412 345 678',
        age: 34,
        gender: 'Male',
        kneeSide: 'Right',
        consentAccepted: true,
        createdAt: getRelativeDate(28, 9, 15),
      },
      {
        firstName: 'Emma',
        lastName: 'Watson',
        email: 'emma.watson@example.com',
        mobile: '+61 423 456 789',
        age: 28,
        gender: 'Female',
        kneeSide: 'Left',
        consentAccepted: true,
        createdAt: getRelativeDate(22, 10, 0),
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@example.com',
        mobile: '+61 434 567 890',
        age: 46,
        gender: 'Male',
        kneeSide: 'Bilateral',
        consentAccepted: true,
        createdAt: getRelativeDate(25, 14, 20),
      },
      {
        firstName: 'Sophie',
        lastName: 'Taylor',
        email: 'sophie.taylor@example.com',
        mobile: '+61 445 678 901',
        age: 59,
        gender: 'Female',
        kneeSide: 'Right',
        consentAccepted: true,
        createdAt: getRelativeDate(29, 8, 45),
      },
      {
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.miller@example.com',
        mobile: '+61 456 789 012',
        age: 23,
        gender: 'Male',
        kneeSide: 'Left',
        consentAccepted: true,
        createdAt: getRelativeDate(7, 11, 10),
      },
      {
        firstName: 'Olivia',
        lastName: 'Brown',
        email: 'olivia.brown@example.com',
        mobile: '+61 467 890 123',
        age: 38,
        gender: 'Female',
        kneeSide: 'Right',
        consentAccepted: true,
        createdAt: getRelativeDate(18, 16, 0),
      },
      {
        firstName: 'William',
        lastName: 'Davis',
        email: 'william.davis@example.com',
        mobile: '+61 478 901 234',
        age: 51,
        gender: 'Male',
        kneeSide: 'Left',
        consentAccepted: true,
        createdAt: getRelativeDate(14, 13, 30),
      },
      {
        firstName: 'Emily',
        lastName: 'Wilson',
        email: 'emily.wilson@example.com',
        mobile: '+61 489 012 345',
        age: 30,
        gender: 'Female',
        kneeSide: 'Right',
        consentAccepted: true,
        createdAt: getRelativeDate(5, 15, 45),
      },
    ];

    const patientMap = new Map<string, Patient>();
    for (const p of patientsData) {
      let patient = await patientRepo.findOne({ where: { email: p.email } });
      if (!patient) {
        patient = patientRepo.create({
          ...p,
          passwordHash: defaultPasswordHash,
        });
        await patientRepo.save(patient);
      }
      patientMap.set(p.email, patient);
    }

    // Clean up previous transient seed data to prevent duplicate keys on re-run
    console.log(
      '🧹 Resetting previous seed records (assessments, chats, notifications)...',
    );
    await dataSource.query(`
            TRUNCATE TABLE 
                chat_message_reactions, 
                messages, 
                conversations, 
                assessments, 
                patient_notifications, 
                staff_notifications 
            CASCADE;
        `);

    // =========================================================================
    // 4. SEED ASSESSMENTS (30-DAY PROGRESSION: RED -> AMBER -> GREEN)
    // =========================================================================
    console.log('📊 Seeding 30-Day Assessments Progression...');
    const john = patientMap.get('john.miller@example.com')!;
    const emma = patientMap.get('emma.watson@example.com')!;
    const michael = patientMap.get('michael.chen@example.com')!;
    const sophie = patientMap.get('sophie.taylor@example.com')!;
    const david = patientMap.get('david.miller@example.com')!;
    const olivia = patientMap.get('olivia.brown@example.com')!;

    // Helper strictly adhering to Assessment scoring formula:
    function calculateScoreAndZone(pain: number, func: number) {
      const score = 10 - pain - func;
      let zone: string;
      if (score > 5) zone = 'green';
      else if (score >= 3) zone = 'amber';
      else zone = 'red';

      return { score, zone };
    }

    const assessmentsToCreate = [
      // John Miller: ACL Reconstruction recovery (Day -28 to Day -1)
      {
        patientId: john.id,
        pain: 8,
        functionScore: 5,
        source: 'Website',
        createdAt: getRelativeDate(28, 9, 30),
      },
      {
        patientId: john.id,
        pain: 6,
        functionScore: 3,
        source: 'Portal',
        createdAt: getRelativeDate(21, 10, 15),
      },
      {
        patientId: john.id,
        pain: 4,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(14, 11, 0),
      },
      {
        patientId: john.id,
        pain: 3,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(7, 9, 45),
      },
      {
        patientId: john.id,
        pain: 1,
        functionScore: 1,
        source: 'Portal',
        createdAt: getRelativeDate(1, 14, 20),
      },

      // Emma Watson: Patellofemoral tracking (Day -22 to Day -2)
      {
        patientId: emma.id,
        pain: 7,
        functionScore: 4,
        source: 'Website',
        createdAt: getRelativeDate(22, 10, 15),
      },
      {
        patientId: emma.id,
        pain: 4,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(15, 12, 30),
      },
      {
        patientId: emma.id,
        pain: 3,
        functionScore: 3,
        source: 'Portal',
        createdAt: getRelativeDate(8, 10, 0),
      },
      {
        patientId: emma.id,
        pain: 1,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(2, 16, 45),
      },

      // Michael Chen: Meniscus tear & Osteoarthritis (Day -25 to Day -3)
      {
        patientId: michael.id,
        pain: 6,
        functionScore: 4,
        source: 'Website',
        createdAt: getRelativeDate(25, 14, 30),
      },
      {
        patientId: michael.id,
        pain: 4,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(18, 9, 0),
      },
      {
        patientId: michael.id,
        pain: 6,
        functionScore: 3,
        source: 'Portal',
        createdAt: getRelativeDate(10, 15, 20),
      }, // flare up
      {
        patientId: michael.id,
        pain: 2,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(3, 11, 15),
      },

      // Sophie Taylor: Total Knee Replacement (Day -29 to Day -4)
      {
        patientId: sophie.id,
        pain: 9,
        functionScore: 3,
        source: 'Website',
        createdAt: getRelativeDate(29, 9, 0),
      },
      {
        patientId: sophie.id,
        pain: 7,
        functionScore: 3,
        source: 'Portal',
        createdAt: getRelativeDate(20, 14, 0),
      },
      {
        patientId: sophie.id,
        pain: 4,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(12, 10, 30),
      },
      {
        patientId: sophie.id,
        pain: 3,
        functionScore: 3,
        source: 'Portal',
        createdAt: getRelativeDate(4, 9, 15),
      },

      // David Miller: Acute Sprain (Day -7 to Day -1)
      {
        patientId: david.id,
        pain: 8,
        functionScore: 3,
        source: 'Website',
        createdAt: getRelativeDate(7, 11, 20),
      },
      {
        patientId: david.id,
        pain: 4,
        functionScore: 2,
        source: 'Portal',
        createdAt: getRelativeDate(1, 15, 30),
      },

      // Olivia Brown: Runner's knee
      {
        patientId: olivia.id,
        pain: 5,
        functionScore: 2,
        source: 'Website',
        createdAt: getRelativeDate(18, 16, 15),
      },
      {
        patientId: olivia.id,
        pain: 2,
        functionScore: 1,
        source: 'Portal',
        createdAt: getRelativeDate(9, 13, 0),
      },

      // Standalone lead assessments from website
      {
        patientId: null,
        pain: 7,
        functionScore: 3,
        source: 'Website',
        createdAt: getRelativeDate(2, 18, 0),
      },
      {
        patientId: null,
        pain: 3,
        functionScore: 3,
        source: 'Website',
        createdAt: getRelativeDate(0, 10, 0),
      },
    ];

    for (const a of assessmentsToCreate) {
      const { score, zone } = calculateScoreAndZone(a.pain, a.functionScore);
      const assessment = assessmentRepo.create({
        patientId: a.patientId,
        pain: a.pain,
        functionScore: a.functionScore,
        score,
        zone,
        source: a.source,
        entryType: 'assessment',
        createdAt: a.createdAt,
      });
      await assessmentRepo.save(assessment);
    }

    // =========================================================================
    // 5. SEED CONVERSATIONS & CHAT MESSAGES WITH REALISTIC MEDICAL PHOTOS
    // =========================================================================
    console.log('💬 Seeding Chat Conversations, Photos, Stickers & Streaks...');

    // Helper to insert a conversation and its messages
    async function createFullConversation(params: {
      patient: Patient;
      streakCount: number;
      streakActiveToday: boolean;
      messagesList: Array<{
        senderType: SenderType;
        body: string;
        daysAgo: number;
        hours: number;
        minutes: number;
        imageUrl?: string;
        stickerUrl?: string;
        reactions?: string[];
      }>;
    }) {
      let conv = await convRepo.findOne({
        where: { patientId: params.patient.id },
      });
      if (!conv) {
        conv = convRepo.create({
          patientId: params.patient.id,
          createdAt: getRelativeDate(
            params.messagesList[0]?.daysAgo || 25,
            8,
            0,
          ),
          streakCount: params.streakCount,
          streakActiveToday: params.streakActiveToday,
          patientMessagedToday: true,
          staffMessagedToday: true,
        });
        await convRepo.save(conv);
      }

      const existingMsgCount = await messageRepo.count({
        where: { conversationId: conv.id },
      });
      if (existingMsgCount > 0) {
        // Conversation already has messages
        return;
      }

      let lastMsgDate: Date = new Date();

      for (const item of params.messagesList) {
        const sentAt = getRelativeDate(item.daysAgo, item.hours, item.minutes);
        lastMsgDate = sentAt;
        const senderId =
          item.senderType === SenderType.PATIENT
            ? params.patient.id
            : primaryDoctor.id;

        const msgId = randomUUID();
        const msg = messageRepo.create({
          id: msgId,
          conversationId: conv.id,
          senderType: item.senderType,
          senderId: senderId,
          body: item.body,
          imageUrl: item.imageUrl,
          stickerUrl: item.stickerUrl,
          sentAt: sentAt,
          readAt: new Date(sentAt.getTime() + 10 * 60 * 1000), // read 10 mins later
          clientTimestamp: sentAt.getTime(),
        });
        await messageRepo.save(msg);

        // Add reactions if specified (ensuring unique user per reaction)
        if (item.reactions && item.reactions.length > 0) {
          const reactorCandidates =
            item.senderType === SenderType.PATIENT
              ? [
                  { id: primaryDoctor.id, type: ReactionSenderType.STAFF },
                  { id: physio.id, type: ReactionSenderType.STAFF },
                ]
              : [{ id: params.patient.id, type: ReactionSenderType.PATIENT }];

          for (let rIdx = 0; rIdx < item.reactions.length; rIdx++) {
            const emoji = item.reactions[rIdx];
            const reactor = reactorCandidates[rIdx % reactorCandidates.length];
            const reaction = reactionRepo.create({
              messageId: msg.id,
              conversationId: conv.id,
              senderType: reactor.type,
              senderId: reactor.id,
              emoji: emoji,
              createdAt: new Date(
                sentAt.getTime() + (rIdx + 1) * 2 * 60 * 1000,
              ),
            });
            await reactionRepo.save(reaction);
          }
        }
      }

      conv.lastMessageAt = lastMsgDate;
      await convRepo.save(conv);
    }

    // --- Conversation 1: John Miller (ACL Rehab, 14-day streak, Photos, Stickers) ---
    await createFullConversation({
      patient: john,
      streakCount: 14,
      streakActiveToday: true,
      messagesList: [
        {
          senderType: SenderType.STAFF,
          body: 'Welcome to the Adelaide Knee Clinic portal, John! We reviewed your post-op ACL surgery notes. Please rest and keep your leg elevated today.',
          daysAgo: 27,
          hours: 9,
          minutes: 0,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Thank you Dr. Sarah. The knee has noticeable swelling around the dressing. Here is a photo from this morning:',
          daysAgo: 26,
          hours: 10,
          minutes: 15,
          imageUrl: REHAB_IMAGES.swelling,
        },
        {
          senderType: SenderType.STAFF,
          body: 'That degree of swelling is completely normal for Day 2. Apply ice packs wrapped in a dry towel for 15-20 minutes every 2-3 hours.',
          daysAgo: 26,
          hours: 10,
          minutes: 40,
          reactions: ['❤️'],
        },
        {
          senderType: SenderType.STAFF,
          body: 'You are doing great, keep going!',
          daysAgo: 26,
          hours: 10,
          minutes: 41,
          stickerUrl: STICKER_URLS.thumbs_up,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Understood, icing it right now. Pain is manageable with the medication.',
          daysAgo: 25,
          hours: 11,
          minutes: 0,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Completed the Day 7 assessment! Down to amber zone and feeling more stable.',
          daysAgo: 21,
          hours: 10,
          minutes: 20,
          reactions: ['👍'],
        },
        {
          senderType: SenderType.STAFF,
          body: 'Fantastic progress, John! Let us introduce gentle isometric quad sets today. Here is the clinic guidance diagram:',
          daysAgo: 20,
          hours: 9,
          minutes: 30,
          imageUrl: REHAB_IMAGES.quad_exercise,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Setting up the exercise space with the resistance band as suggested:',
          daysAgo: 16,
          hours: 14,
          minutes: 10,
          imageUrl: REHAB_IMAGES.stretching,
        },
        {
          senderType: SenderType.STAFF,
          body: 'Setup looks perfect! Ensure your hips remain square during the straight leg raise.',
          daysAgo: 16,
          hours: 14,
          minutes: 35,
          stickerUrl: STICKER_URLS.clap,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Hit 110 degrees flexion during physical therapy yesterday! Minimal stiffness this morning.',
          daysAgo: 10,
          hours: 9,
          minutes: 5,
          reactions: ['😮', '❤️'],
        },
        {
          senderType: SenderType.STAFF,
          body: '110 degrees at Week 3 is ahead of target schedule! Keep maintaining the calf stretches.',
          daysAgo: 10,
          hours: 9,
          minutes: 45,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Here is the current joint appearance without the brace. Skin has healed cleanly.',
          daysAgo: 5,
          hours: 11,
          minutes: 0,
          imageUrl: REHAB_IMAGES.clinic_visit,
        },
        {
          senderType: SenderType.STAFF,
          body: 'Incision healed remarkably well. You can now transition out of the heavy brace for sleeping.',
          daysAgo: 5,
          hours: 11,
          minutes: 30,
          reactions: ['👍'],
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Good morning Dr. Sarah! Can I begin stationary cycling with low resistance this week?',
          daysAgo: 0,
          hours: 8,
          minutes: 45,
        },
        {
          senderType: SenderType.STAFF,
          body: 'Yes, absolutely! Start with 10 minutes at zero resistance. Stop immediately if you feel sharp anterior pain.',
          daysAgo: 0,
          hours: 9,
          minutes: 10,
          reactions: ['❤️'],
        },
      ],
    });

    // --- Conversation 2: Emma Watson (Patellofemoral Pain, 7-day streak, Taping photo) ---
    await createFullConversation({
      patient: emma,
      streakCount: 7,
      streakActiveToday: true,
      messagesList: [
        {
          senderType: SenderType.STAFF,
          body: 'Hi Emma, welcome to the clinic. We noticed your pain level is 7 on descending stairs. Let us work together on patellar alignment.',
          daysAgo: 21,
          hours: 11,
          minutes: 0,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Hi team! Yes, running downhill or stairs is where it hurts most.',
          daysAgo: 21,
          hours: 11,
          minutes: 30,
        },
        {
          senderType: SenderType.STAFF,
          body: 'We recommend McConnell patellar taping. Try this technique before walking:',
          daysAgo: 18,
          hours: 9,
          minutes: 15,
          imageUrl: REHAB_IMAGES.xray,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Applied the tape today. Does the tension look right across the lateral border?',
          daysAgo: 14,
          hours: 13,
          minutes: 20,
          imageUrl: REHAB_IMAGES.ice_wrap,
        },
        {
          senderType: SenderType.STAFF,
          body: 'Spot on! Make sure there are no skin creases under the anchor strip.',
          daysAgo: 14,
          hours: 13,
          minutes: 50,
          stickerUrl: STICKER_URLS.thumbs_up,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Huge difference on the stairs today. Only slight ache after a 3km walk.',
          daysAgo: 6,
          hours: 17,
          minutes: 10,
          reactions: ['❤️'],
        },
        {
          senderType: SenderType.STAFF,
          body: 'Excellent! Focus on glute medius strengthening next.',
          daysAgo: 6,
          hours: 17,
          minutes: 45,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Completed the Day 28 reassessment! Green zone achieved 🟢',
          daysAgo: 1,
          hours: 15,
          minutes: 0,
          reactions: ['😮', '❤️'],
        },
      ],
    });

    // --- Conversation 3: Michael Chen (Meniscus & Arthritis, 5-day streak) ---
    await createFullConversation({
      patient: michael,
      streakCount: 5,
      streakActiveToday: false,
      messagesList: [
        {
          senderType: SenderType.STAFF,
          body: 'Hello Michael, following up on your knee MRI report. The medial meniscus shows mild fraying but surgery is not required.',
          daysAgo: 24,
          hours: 10,
          minutes: 0,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'That is reassuring news. I was worried about an arthroscopy.',
          daysAgo: 24,
          hours: 10,
          minutes: 35,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'I had a mild flare-up after gardening over the weekend. I took a photo of the ice compression wrap I used:',
          daysAgo: 10,
          hours: 15,
          minutes: 20,
          imageUrl: REHAB_IMAGES.ice_wrap,
        },
        {
          senderType: SenderType.STAFF,
          body: 'Good choice with the cold compression. Avoid deep squatting for the next 48 hours.',
          daysAgo: 10,
          hours: 16,
          minutes: 0,
          reactions: ['👍'],
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Swelling has completely subsided now. Back on the rowing machine without pain.',
          daysAgo: 2,
          hours: 14,
          minutes: 15,
        },
      ],
    });

    // --- Conversation 4: Sophie Taylor (Total Knee Replacement, 3-day streak) ---
    await createFullConversation({
      patient: sophie,
      streakCount: 3,
      streakActiveToday: true,
      messagesList: [
        {
          senderType: SenderType.STAFF,
          body: 'Good morning Sophie. How was your sleep last night with the knee pillow?',
          daysAgo: 19,
          hours: 9,
          minutes: 0,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Much better! Having the pillow between my legs prevented twisting.',
          daysAgo: 19,
          hours: 9,
          minutes: 40,
        },
        {
          senderType: SenderType.PATIENT,
          body: 'Transitioned from the four-wheel walker to a single walking stick today during our hospital physio session!',
          daysAgo: 11,
          hours: 16,
          minutes: 0,
          imageUrl: REHAB_IMAGES.clinic_visit,
        },
        {
          senderType: SenderType.STAFF,
          body: 'What a milestone, Sophie! Truly proud of your dedication.',
          daysAgo: 11,
          hours: 16,
          minutes: 30,
          stickerUrl: STICKER_URLS.clap,
          reactions: ['❤️'],
        },
      ],
    });

    // =========================================================================
    // 6. SEED NOTIFICATIONS (PATIENT & STAFF NOTIFICATIONS OVER 30 DAYS)
    // =========================================================================
    console.log('🔔 Seeding Notifications History...');
    const patientNotifs = [
      {
        patientId: john.id,
        type: NotificationType.WELCOME,
        title: 'Welcome to Adelaide Knee Clinic',
        body: 'Your personalized rehabilitation plan is now active.',
        payload: { link: '/dashboard' },
        createdAt: getRelativeDate(28, 9, 20),
        readAt: getRelativeDate(28, 9, 25),
      },
      {
        patientId: john.id,
        type: NotificationType.ASSESSMENT_REMINDER,
        title: 'Weekly Progress Check-in',
        body: 'Please complete your Week 2 knee assessment to adjust your exercise plan.',
        payload: { link: '/assessments' },
        createdAt: getRelativeDate(14, 8, 0),
        readAt: getRelativeDate(14, 10, 50),
      },
      {
        patientId: john.id,
        type: NotificationType.CLINIC_MESSAGE,
        title: 'New message from Dr. Sarah',
        body: 'Yes, start with zero resistance for 10 minutes.',
        payload: { link: '/chat' },
        createdAt: getRelativeDate(0, 9, 10),
        readAt: null,
      },
      {
        patientId: emma.id,
        type: NotificationType.WELCOME,
        title: 'Welcome to Adelaide Knee Clinic',
        body: 'Your patellar stabilization plan has been uploaded.',
        payload: { link: '/dashboard' },
        createdAt: getRelativeDate(22, 10, 5),
        readAt: getRelativeDate(22, 10, 10),
      },
      {
        patientId: emma.id,
        type: NotificationType.CLINIC_MESSAGE,
        title: 'Message from Dr. Sarah',
        body: 'Spot on! Make sure there are no skin creases under the anchor strip.',
        payload: { link: '/chat' },
        createdAt: getRelativeDate(14, 13, 50),
        readAt: getRelativeDate(14, 14, 0),
      },
    ];

    for (const pn of patientNotifs) {
      const notif = patientNotifRepo.create(pn);
      await patientNotifRepo.save(notif);
    }

    const staffNotifs = [
      {
        userId: primaryDoctor.id,
        type: 'new_lead' as const,
        title: 'New Patient Assessment (Red Zone)',
        body: 'David Miller completed an assessment scoring 8/10 pain (Acute Sprain).',
        payload: { link: '/leads' },
        createdAt: getRelativeDate(7, 11, 25),
        readAt: getRelativeDate(7, 12, 0),
      },
      {
        userId: primaryDoctor.id,
        type: 'patient_message' as const,
        title: 'Photo from John Miller',
        body: 'John sent a photo of his knee dressing.',
        payload: { link: '/messages' },
        createdAt: getRelativeDate(26, 10, 16),
        readAt: getRelativeDate(26, 10, 30),
      },
      {
        userId: primaryDoctor.id,
        type: 'patient_message' as const,
        title: 'Message from John Miller',
        body: 'Good morning Dr. Sarah! Can I begin stationary cycling this week?',
        payload: { link: '/messages' },
        createdAt: getRelativeDate(0, 8, 45),
        readAt: null,
      },
    ];

    for (const sn of staffNotifs) {
      const notif = staffNotifRepo.create(sn);
      await staffNotifRepo.save(notif);
    }

    console.log(
      '\n=============================================================',
    );
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log(
      '=============================================================',
    );
    console.log('\n🔑 TEST CREDENTIALS:');
    console.log(
      '-------------------------------------------------------------',
    );
    console.log('👨‍⚕️ STAFF PORTAL (http://localhost:3000):');
    console.log('   - Doctor:  doctor@adelaidekneeclinic.com  / Password123!');
    console.log('   - Physio:  physio@adelaidekneeclinic.com  / Password123!');
    console.log('   - Admin:   admin@akc.com                  / Password123!');
    console.log('\n🧑 PATIENT PORTAL (http://localhost:3002):');
    console.log(
      '   - John Miller:    john.miller@example.com    / Password123! (14-day streak, Photos)',
    );
    console.log(
      '   - Emma Watson:    emma.watson@example.com    / Password123! (7-day streak, Taping)',
    );
    console.log(
      '   - Michael Chen:   michael.chen@example.com   / Password123! (5-day streak)',
    );
    console.log(
      '   - Sophie Taylor:  sophie.taylor@example.com  / Password123! (TKR Recovery)',
    );
    console.log(
      '   - David Miller:   david.miller@example.com   / Password123! (Acute Sprain)',
    );
    console.log(
      '=============================================================\n',
    );
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await app.close();
  }
}

void seed();
