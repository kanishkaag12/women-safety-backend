const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testHttpAssign() {
    try {
        // First, login as police officer to get a token
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'suni234@gmail.com',
                password: 'testpass123'
            })
        });

        if (!loginResponse.ok) {
            console.error('Login failed:', loginResponse.status);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('Login successful, token:', token.substring(0, 20) + '...');

        // Now try to assign the case
        const assignResponse = await fetch('http://localhost:5000/api/alerts/689f31d9b26477f688865ee1/assign', {
            method: 'PUT',
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assignedPoliceOfficer: '689f117c813ca6d1b82a75cb',
                policeStation: 'Thana',
                badgeNumber: '9876',
                jurisdiction: 'Downtown'
            })
        });

        console.log('Assign response status:', assignResponse.status);
        
        if (assignResponse.ok) {
            const result = await assignResponse.json();
            console.log('Assign successful:', result);
        } else {
            const error = await assignResponse.json();
            console.error('Assign failed:', error);
        }

        // Now fetch assigned cases
        const assignedResponse = await fetch('http://localhost:5000/api/alerts/assigned/689f117c813ca6d1b82a75cb', {
            headers: {
                'x-auth-token': token
            }
        });

        console.log('Assigned cases response status:', assignedResponse.status);
        
        if (assignedResponse.ok) {
            const assignedCases = await assignedResponse.json();
            console.log('Assigned cases:', assignedCases);
        } else {
            const error = await assignedResponse.json();
            console.error('Failed to fetch assigned cases:', error);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testHttpAssign();
