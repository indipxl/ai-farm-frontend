import asyncio
from firebase_admin import firestore
from services.analysis_sensor_data import process_batch_analysis

# The interval between AI analysis runs. 
SCHEDULE_INTERVAL_SECONDS = 1440 * 60  # in sec. so x min * 60 sec

async def automated_ai_loop():
    """
    Infinity loop that wakes up every X minutes, finds populated batches,
    and processes their latest sensor readings through Gemini.
    """
    print(f"Starting Automated AI Engine. Interval set to {SCHEDULE_INTERVAL_SECONDS / 60} minutes.")
    db = firestore.client()
    
    while True:
        try:
            print("\n--- Running AI Background Sweep ---")
            
            # Pull all batches
            batches_ref = db.collection('batches').get()
            
            processed_count = 0
            for doc in batches_ref:
                batch_data = doc.to_dict()
                batch_id = doc.id
                batch_data['__doc_id'] = batch_id 
                
                # Skip archived completely 
                if batch_data.get('status') == 'archived':
                    continue
                
                # not run the analysis if there is no batch assign to the block
                location = batch_data.get('location', '')
                if not location or location.strip() == '':
                    print(f"[SKIP] Batch {batch_id} ({batch_data.get('crop', 'Unknown')}): No physical block assigned.")
                    continue
                
                # Start analysis
                try:
                    await asyncio.to_thread(process_batch_analysis, batch_data, batch_id)
                    print(f"[SUCCESS] Analyzed Batch {batch_id} ({batch_data.get('crop', 'Unknown')} in {location})")
                    processed_count += 1
                except Exception as e:
                    print(f"[FAILED] Batch {batch_id}: {str(e)}")

            print(f"--- Sweep Complete. {processed_count} batches successfully analyzed. ---")

        except Exception as e:
            print(f"Critical error in AI loop: {e}")
            
        print(f"Sleeping for {SCHEDULE_INTERVAL_SECONDS / 60} minutes...\n")
        await asyncio.sleep(SCHEDULE_INTERVAL_SECONDS)
