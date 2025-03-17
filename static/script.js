$(document).ready(function () {
    // Button to open modal
    $("#myBtn").click(function () {
        $("#myModal").modal();
    });

    // Handle form submission
    $("#connectForm").on("submit", function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Get values from the form
        const ipserver = $("#ipserver").val();
        const username = $("#username").val();
        const password = $("#psw").val();

        // Send AJAX request to connect to the server
        $.ajax({
            url: '/connect',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ ipserver, username, password }),
            success: function (data) {
                // Update the monitoring values
                $("#uptime").text(data.uptime);
                $("#users").text(data.users);
                $("#os_name").text(data.os_name);
                $("#cpu-usage").text(data.cpu_usage + '%');
                $("#load-average").text(data.load_average);
                $("#ram-usage").text(data.ram_usage);
                $("#disk-space").text(data.disk_space);

                // Update progress bars
                updateProgressBar('cpu-progress', 'cpu-usage');
                updateProgressBar('ram-progress', 'ram-usage');
                updateProgressBar('disk-progress', 'disk-space');
                updateProgressBar('load-progress', 'load-average');

                // Update charts with new data
                updateCharts(parseFloat(data.cpu_usage), parseFloat(data.ram_usage));
            },
            error: function (error) {
                console.error("Error connecting to server:", error);
                alert("Failed to connect to the server. Please check your credentials and IP address.");
            }
        });
    });

    // Maintenance commands
    $("#clean-temp").on("click", function () {
        executeMaintenanceCommand("Clean Temporary Files", "rm -rf /tmp/*");
    });

    $("#update-packages").on("click", function () {
        executeMaintenanceCommand("Update Packages", "sudo apt-get update -y && sudo apt-get upgrade -y");
    });

    $("#check-logs").on("click", function () {
        executeMaintenanceCommand("Check Logs", "tail -n 50 /var/log/syslog");
    });

    function executeMaintenanceCommand(commandName, command) {
        const ipserver = $("#ipserver").val();
        const username = $("#username").val();
        const password = $("#psw").val();

        $.ajax({
            url: '/maintenance',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ ipserver, username, password, command }),
            success: function (data) {
                if (commandName === "Clean Temporary Files") {
                    $("#clean-output").text(data.output);
                } else if (commandName === "Update Packages") {
                    $("#update-output").text(data.output);
                } else if (commandName === "Check Logs") {
                    $("#log-output").text(data.output);
                }
            },
            error: function (error) {
                console.error("Error executing maintenance command:", error);
                alert("Failed to execute maintenance command.");
            }
        });
    }

    // Progress Bar Update
    function updateProgressBar(progressId, valueId) {
        const valueElement = document.getElementById(valueId);
        const progressBar = document.getElementById(progressId);

        let value = parseFloat(valueElement.textContent.replace('%', ''));

        if (!isNaN(value)) {
            progressBar.style.width = value + '%';
            progressBar.setAttribute('aria-valuenow', value);
        }
    }

    // Toggle More Content
    const toggleButton = document.getElementById('toggleButton');
    const chartSection = document.getElementById('chartSection');

    toggleButton.addEventListener('click', () => {
        if (chartSection.style.display === 'none' || chartSection.style.display === '') {
            chartSection.style.display = 'block';
            toggleButton.textContent = 'Hide';
        } else {
            chartSection.style.display = 'none';
            toggleButton.textContent = 'More';
        }
    });

    // Data statis untuk chart penggunaan memori
    const memoryData = {
        labels: ['Senin', 'Selasa', 'Rabu', 'Kamin', 'Jumat', 'Sabtu', 'Minggu'],
        datasets: [{
            label: 'Memory Usage (%)',
            data: [65, 59, 50, 61, 56, 55, 40],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    // Data statis untuk chart penggunaan CPU
    const cpuData = {
        labels: ['Senin', 'Selasa', 'Rabu', 'Kamin', 'Jumat', 'Sabtu', 'Minggu'],
        datasets: [{
            label: 'CPU Usage (%)',
            data: [10, 10, 90, 90, 10, 10, 10],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };

    // Konfigurasi chart untuk penggunaan memori
    const memoryConfig = {
        type: 'line',
        data: memoryData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    // Konfigurasi chart untuk penggunaan CPU
    const cpuConfig = {
        type: 'line',
        data: cpuData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    // Membuat chart untuk penggunaan memori
    const memoryChart = new Chart(
        document.getElementById('memory-chart'),
        memoryConfig
    );

    // Membuat chart untuk penggunaan CPU
    const cpuChart = new Chart(
        document.getElementById('cpu-chart'),
        cpuConfig
    );
});