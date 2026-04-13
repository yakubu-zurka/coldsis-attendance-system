Deploying the Cloud Function

1. Install dependencies inside the `functions` folder:

```bash
cd functions
npm install
```

2. Configure office coordinates and allowed radius (optional):

```bash
firebase functions:config:set office.lat="5.697796" office.lng="-0.176180" office.radius="100"
```

3. Deploy the function:

```bash
firebase deploy --only functions:validateAttendance
```

Notes:
- The function listens for new nodes under `/attendance/{recordId}` and computes server-side distance and validation.
- It writes `serverValidated`, `serverDistance`, `serverEffectiveDistance`, and `validationMessage` fields back to the attendance record.
- Keep in mind you must have Firebase CLI installed and be logged in.
