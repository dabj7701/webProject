document.addEventListener('DOMContentLoaded', fetchSkins); 

const modalOverlay = document.getElementById('modalOverlay'); 
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal')

function openModal(type){
    modalOverlay.style.display = 'flex';
    if(type === 'login'){
        loginModal.style.display = 'block';
        registerModal.style.display = 'none';
    } else {
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    }
}

function closeModal(){
    modalOverlay.style.display = 'none';
}

document.getElementById('headerLoginBtn').addEventListener('click',() => openModal('login'));
document.getElementById('textLoginLink').addEventListener('click', (e) => {e.preventDefault(); openModal('login');});
document.getElementById('headerRegisterBtn').addEventListener('click', () => openModal('register'));
document.getElementById('switchToRegister').addEventListener('click', (e) => {e.preventDefault(); openModal('register');});
document.getElementById('switchToLogin').addEventListener('click', (e) => {e.preventDefault(); openModal('login')});

document.getElementById('closeLogin').addEventListener('click', closeModal);
document.getElementById('closeRegister').addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if(e.target === modalOverlay) closeModal();
})

function showMessage(elementId, message, isError = true){
    const el = document.getElementById(elementId);
    el.textContent = message; 
    el.style.color = isError ? 'red' : 'green'; 
    el.style.display = 'block'
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    console.log(username, password);

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({username, password})
    })
    .then(res => res.json().then(data => ({status: res.status, body: data})))
    .then(res =>{
        if(res.status === 200){
            closeModal();
            document.getElementById('loginForm').reset();
            document.getElementById('unauthenticatedState').style.display = 'none';
            fetchSkins();
        } else {
            showMessage('loginMessage', res.body.error);
        }
    });
});

document.getElementById('registerForm').addEventListener('submit', (e) =>{
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data})))
    .then(res => {
        if(res.status === 201){
            showMessage('registerMessage', 'Account created, redirecting to login', false);
            document.getElementById('registerForm').reset();
            setTimeout(() => openModal('login'), 1500);
        } else {
            showMessage('registerMessage', res.body.error, true);
        }
    })
})

function updateAuthUI(isLoggenIn){
    const loginBtn = document.getElementById('headerLoginBtn');
    const regBtn = document.getElementById('headerRegisterBtn');
    const logoutBtn = document.getElementById('headerLogoutBtn');
    
    if(isLoggenIn){
        if(loginBtn) loginBtn.style.display = 'none';
        if(regBtn) regBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(regBtn) regBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'none';
    }
}

document.getElementById('headerLogoutBtn').addEventListener('click', (e) => {
    e.preventDefault(); 
    fetch('/api/logout', {
        method: 'POST'
    })
    .then(res => {
        if(res.ok){
            updateAuthUI(false);

            document.getElementById('unauthenticatedState').style.display = 'block';

            const container = document.getElementById('skinsContainer');
            container.style.display = 'none';
            container.innerHTML = '';

            document.getElementById('totalValueContainer').textContent = '0';
            document.getElementById('statusMessage').style.display = 'none';
        }
    }).catch(error => {
        console.log('Error while trying to log out', error); 
    })
})

function fetchSkins(){
    const container = document.getElementById('skinsContainer');
    const statusMessage = document.getElementById('statusMessage');
    const totalValueSpan = document.getElementById('totalValue'); 

    statusMessage.textContent = 'Retrieving data...'; 
    statusMessage.className = 'status-message'; 
    statusMessage.style.display = 'block'
    container.style.display = 'none'

    fetch('/api/skins')
        .then(response => {
            if(response.status === 401){
                document.getElementById('unauthenticatedState').style.display = 'block'; 
                document.getElementById('skinsContainer').style.display = 'none'; 
                statusMessage.style.display = 'none';
                updateAuthUI(false);
                throw new Error('NOT_LOGGED_IN'); 
            }

            if(!response.ok){
                throw new Error('Network response was not OK')
            }
            return response.json();
        })
        .then(skins => {
            console.log('GET response data:', skins)

            updateAuthUI(true);
            document.getElementById('unauthenticatedState').style.display = 'none';

            if(skins.length === 0){
                statusMessage.textContent = 'No objects in the collection. Please try add an item.'
                return; 
            }

            statusMessage.style.display = 'none'; 
            container.style.display = 'grid'; 
            container.innerHTML = ''; 

            let totalValue = 0; 


            skins.forEach(skin => {
                totalValue += Number(skin.price)
                const article = document.createElement('article');
                article.classList.add('skin-card'); 

                article.innerHTML = `
                <div class="skin-info">
                    <h3>${skin.skin_name}</h3>
                    <div>
                        <span class="category">${skin.category_name}</span>
                        <span class="condition">${skin.condition_name}</span>
                    </div>
                </div>
                <div class="skin-price">
                    ${skin.price} kr
                </div>
                `;
                container.appendChild(article)
            });
            totalValueSpan.textContent = totalValue.toLocaleString('sv-SE'); 
        })
        .catch(error =>{
            if(error.message !== 'NOT_LOGGED_IN'){
                console.log('Error with retrieving', error);
                document.getElementById('unauthenticatedState').style.display = 'none';
                statusMessage.textContent ='Server error: Could not retrieve your items';
                statusMessage.classList.add('Error');
                statusMessage.style.display = 'block'
            }
        });
}

