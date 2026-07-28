import sys
sys.path.insert(0, 'C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend')
import os
os.chdir('C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend')
try:
    from main import app
    # Try writing to a unique path
    fpath = 'C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend/_import_status.txt'
    with open(fpath, 'w') as f:
        f.write('IMPORT_OK')
        for r in app.routes:
            f.write('\n' + r.path)
except Exception as e:
    fpath = 'C:/Users/User/Desktop/lowcodeProyecto/SDD-PIIF-24-01/generated_projects/app/backend/_import_status.txt'
    with open(fpath, 'w') as f:
        f.write('ERROR: ' + str(e))
