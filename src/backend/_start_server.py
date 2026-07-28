import sys
sys.path.insert(0, 'C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend')
import os
os.chdir('C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend')
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=12622, log_level='info')
