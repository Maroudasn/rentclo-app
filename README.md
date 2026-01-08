# RentClo – Πλατφόρμα Ενοικίασης Ρούχων μέσω LLM-Driven Development

Η **RentClo** είναι μια πλήρως λειτουργική διαδικτυακή εφαρμογή ενοικίασης ρούχων, αναπτυγμένη **εξ ολοκλήρου μέσω Μηχανικής Προτροπών (Prompt Engineering)**, χωρίς άμεση συγγραφή κώδικα από τον δημιουργό.  
Η ανάπτυξη πραγματοποιήθηκε στο πλαίσιο της πτυχιακής εργασίας με θέμα:

> «Σχεδιασμός και υλοποίηση υπηρεσίας λογισμικού με χρήση μεγάλου γλωσσικού μοντέλου»

---

##  Σκοπός του έργου

Η εργασία διερευνά κατά πόσο ένα **Μεγάλο Γλωσσικό Μοντέλο (LLM)**, όπως το **DeepSeek-Coder**, μπορεί να παραγάγει:
- λειτουργικό και συνεκτικό κώδικα,  
- πλήρη αρχιτεκτονική frontend–backend–database,  
- και ένα βιώσιμο πληροφοριακό σύστημα πραγματικής χρήσης.

Το RentClo λειτουργεί ως **πειραματική εφαρμογή**, ενδεικτική των δυνατοτήτων αλλά και των περιορισμών των LLMs στην ανάπτυξη λογισμικού.

---

##  Τεχνολογίες

| Επίπεδο | Τεχνολογία |
|----------|-------------|
| Frontend | React 18, React Router, Axios |
| Backend | FastAPI (Python), Pydantic, Uvicorn |
| Database | SQLite |
| Authentication | JWT Tokens, Session Management |
| Ασφάλεια | Bearer Token Validation, Input Validation |

---

##  Δομή του Έργου

rentclo-app/
├── backend/ # FastAPI server (API, routes, models)
├── frontend/ # React application (components, pages, context)
└── database/ # Initialization & schema scripts

---

##  Οδηγίες Εκτέλεσης

 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt

## 2. Start Backend Server
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

Backend runs on: http://localhost:8001

## 3. Frontend Setup (New Terminal)
cd frontend
npm install

## 4. Start Frontend
npm start
Frontend runs on: http://localhost:3000

##  **Δημιουργός**

Νικόλαος-Γεώργιος Μαρούδας

Πτυχιακή εργασία, Τμήμα Πληροφορικής / Αριστοτέλειο Πανεπιστήμιο Θεσσαλονίκης

Επιβλέποντες: Σταμέλος Ιωάννης,Απόστολος Κρητικός







