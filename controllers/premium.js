const db = require('../util/database');

// AWS SDK v3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { fromEnv } = require('@aws-sdk/credential-provider-env');

// S3 config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});


/**
 * ================= LEADERBOARD =================
 */
exports.getLeaderBoardDetails = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        u.id AS userId,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        COALESCE(SUM(e.amount), 0) AS totalExpense
      FROM users u
      LEFT JOIN expenses e ON u.id = e.user_id
      GROUP BY u.id
      ORDER BY totalExpense DESC
    `);

    return res.status(200).json(rows);

  } catch (err) {
    console.error('Leaderboard Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


/**
 * ================= GENERATE REPORT =================
 */
exports.generateReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileName = req.body.fileName || `report-${Date.now()}`;
    const fileKey = `${fileName}.csv`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: 'text/csv',
      })
    );

    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Save in DB
    await db.execute(
      `INSERT INTO reports (file_name, url, user_id)
       VALUES (?, ?, ?)`,
      [fileName, fileUrl, req.user.userId]
    );

    return res.status(200).json({
      fileName,
      generatedDate: new Date(),
      url: fileUrl
    });

  } catch (err) {
    console.error('Generate Report Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


/**
 * ================= GET ALL REPORTS =================
 */
exports.getAllReports = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT file_name, created_at, url
       FROM reports
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    const formatted = rows.map(r => ({
      fileName: r.file_name,
      generatedDate: r.created_at,
      url: r.url
    }));

    return res.status(200).json(formatted);

  } catch (err) {
    console.error('Get Reports Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};