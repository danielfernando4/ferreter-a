import sys
sys.path.insert(0, 'C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend')
import os
os.chdir('C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend')
try:
    from main import app
    with open('/app/backend/_result.txt', 'w') as f:
        f.write('IMPORT_OK')
        for r in app.routes:
            f.write('\n' + r.path)
except Exception as e:
    with open('/app/backend/_result.txt', 'w') as f:
        f.write('ERROR: ' + str(e))
