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
document.getElementById('closeAddSkin').addEventListener('click', closeModal);

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
    const totalValueContainer = document.getElementById('totalValueContainer');
    
    if(isLoggenIn){
        if(loginBtn) loginBtn.style.display = 'none';
        if(regBtn) regBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
        if(totalValueContainer) totalValueContainer.style.display = 'block';
    } else {
        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(regBtn) regBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(totalValueContainer) totalValueContainer.style.display = 'none';
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

document.getElementById('addSkinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('addSkinName').value; 
    const price = document.getElementById('addSkinPrice').value;
    const category_id = document.getElementById('addSkinCategory').value; 
    const condition_id = document.getElementById('addSkinCondition').value;
    const image_url = document.getElementById('addSkinImage').value; 

    fetch('/api/skins', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, price, category_id, condition_id, image_url})
    })
    .then(res => {
        if(res.ok){
            closeModal();
            document.getElementById('addSkinForm').reset();
            document.getElementById('addSkinModal').style.display = 'none';
            fetchSkins();
        } else {
            return res.json().then(data => {
                showMessage('addSkinMessage', data.error, true);
            })
        }
    })
    .catch(err => console.log('Error adding skin:', err)); 
})


function editSkin(skin) {
    document.getElementById('editSkinId').value = skin.id;
    document.getElementById('editSkinName').value = skin.skin_name;
    document.getElementById('editSkinPrice').value = skin.price;
    document.getElementById('editSkinImage').value = skin.image_url || '';

    window.currentEditingSkin = skin; 

    document.getElementById('editSkinModal').style.display = 'flex';
}

document.getElementById('closeEditModalBtn').addEventListener('click', () => {
    document.getElementById('editSkinModal').style.display = 'none';
});

document.getElementById('editSkinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editSkinId').value;
    const name = document.getElementById('editSkinName').value;
    const price = document.getElementById('editSkinPrice').value;
    const image_url = document.getElementById('editSkinImage').value;
    
    const category_id = window.currentEditingSkin.category_id;
    const condition_id = window.currentEditingSkin.condition_id;
    const user_id = window.currentEditingSkin.user_id;

    fetch(`/api/skins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, category_id, condition_id, user_id, image_url })
    })
    .then(res => {
        if(res.ok) {
            document.getElementById('editSkinModal').style.display = 'none';
            fetchSkins();
        } else {
            return res.json().then(data => alert(data.error || 'Could not update skin!'));
        }
    })
    .catch(err => console.log('Error updating skin:', err));
});


function deleteSkin(skinId) {
    if(!confirm('Are you sure that you want to delete this item from your collection?')) {
        return;
    }

    fetch(`/api/skins/${skinId}`, {
        method: 'DELETE'
    })
    .then(res => {
        if(res.ok) {
            fetchSkins();
        } else {
            alert('Could not remove item!');
        }
    })
    .catch(err => console.log('Error deleting skin:', err));
}

function fetchSkins(){
    const container = document.getElementById('skinsContainer');
    const statusMessage = document.getElementById('statusMessage');
    const totalValueSpan = document.getElementById('totalValueContainer'); 

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

            

            statusMessage.style.display = 'none'; 
            container.style.display = 'grid'; 
            container.innerHTML = ''; 

            let totalValue = 0; 


            skins.forEach(skin => {
                totalValue += Number(skin.price)
                const article = document.createElement('article');
                article.classList.add('skin-card'); 

                const imgSrc = skin.image_url ? skin.image_url : "https://placehold.co/400x300/2a2a2a/ffffff?text=No+Image";

                article.innerHTML = `
                <div style="text-align: center; margin-bottom: 10px; height: 150px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 5px; background: #1a1a1a;">
                    <img src="${imgSrc}" alt="${skin.skin_name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <div class="skin-info">
                    <h3>${skin.skin_name}</h3>
                    <div>
                        <span class="category">${skin.category_name}</span>
                        <span class="condition">${skin.condition_name}</span>
                    </div>
                </div>
                <div class="skin-price" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span>${skin.price} kr</span>

                        <button class="edit-btn" style="background: #3498db; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-weight: bold; font-size: 0.8em;">Edit</button>
                        
                        <button class="delete-btn" data-id="${skin.id}" style="background: #e74c3c; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-weight: bold; font-size: 0.8em; line-height: 1;">
                            Delete
                        </button>
                    </div>

                `;

                const editBtn = article.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => {
                    editSkin(skin);
                });

                const deleteBtn = article.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    deleteSkin(skin.id);
                });

                container.appendChild(article)
            });
            totalValueSpan.textContent = totalValue.toLocaleString('sv-SE'); 

            const addCard = document.createElement('article');
            addCard.classList.add('skin-card');
            addCard.style.display = 'flex';
            addCard.style.justifyContent = 'center';
            addCard.style.alignItems = 'center';
            addCard.style.cursor = 'pointer';
            addCard.style.border = '2px dashed #ccc'; 

            addCard.innerHTML = `
               <div style="text-align: center; color: #888;">
                    <h3 style="font-size: 3em; margin: 0; line-height: 1;">+</h3>
                    <p style="margin: 5px 0 0 0; font-weight: bold;">Add Skin</p>
                </div> 
            `

            addCard.addEventListener('click', () => {
                document.getElementById('modalOverlay').style.display = 'flex';
                document.getElementById('loginModal').style.display = 'none';
                document.getElementById('registerModal').style.display = 'none';
                document.getElementById('addSkinModal').style.display = 'block'
            })
            container.appendChild(addCard);
        })
        .catch(error =>{
            if(error.message !== 'NOT_LOGGED_IN'){
                console.log('Error with retrieving', error);
                document.getElementById('unauthenticatedState').style.display = 'none';
                statusMessage.textContent ='Server error: Could not retrieve your items';
                statusMessage.classList.add('Error');
                statusMessage.style.display = 'block'
                container.style.display = 'none'
            }
        });
}

