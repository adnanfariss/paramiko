from flask import Flask, render_template, request, jsonify
import paramiko

app = Flask(__name__)

# Fungsi untuk menjalankan perintah di server remote
def run_command_on_remote(hostname, port, username, password, command):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname, port=port, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        ssh.close()

        if error:
            return f"Error: {error}"
        return output

    except Exception as e:
        return f"Error: {e}"

@app.route('/')
def index():
    # Nilai default untuk monitoring
    return render_template('index.html', uptime="0", users="0", os_name="0", cpu_usage="0", load_average="0", ram_usage="0", disk_space="0")

@app.route('/connect', methods=['POST'])
def connect():
    data = request.json
    hostname = data['ipserver']
    username = data['username']
    password = data['password']

    # Monitoring commands
    uptime = run_command_on_remote(hostname, 22, username, password, "uptime -p")
    users = run_command_on_remote(hostname, 22, username, password, "uptime | awk -F'(up |,)' '{print $3}'")
    os_name = run_command_on_remote(hostname, 22, username, password, "grep '^NAME=' /etc/os-release | cut -d'=' -f2")
    cpu_usage = run_command_on_remote(hostname, 22, username, password, "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'")
    load_average = run_command_on_remote(hostname, 22, username, password, "uptime | awk -F'(up |,)' '{print $4 $5 $6}'")
    ram_usage = run_command_on_remote(hostname, 22, username, password, "free -m | awk 'NR==2 {printf \"%.2f%%\", $3*100/$2}'")
    disk_space = run_command_on_remote(hostname, 22, username, password, "df -h | awk '$NF==\"/\"{printf \"%s\", $5}'")

    return jsonify({
        'uptime': uptime,
        'users': users,
        'os_name': os_name,
        'cpu_usage': cpu_usage,
        'load_average': load_average,
        'ram_usage': ram_usage,
        'disk_space': disk_space
    })

@app.route('/maintenance', methods=['POST'])
def maintenance():
    data = request.json
    hostname = data['ipserver']
    username = data['username']
    password = data['password']
    command = data['command']

    # Menangani perintah pemeliharaan
    if command == "tail -n 50 /var/log/syslog":
        command = "journalctl -n 50"  # Ganti dengan perintah yang sesuai

    output = run_command_on_remote(hostname, 22, username, password, command)
    return jsonify({'output': output})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2222)