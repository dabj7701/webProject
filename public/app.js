let currentEditingSkin = null; 
let currentViewedUser = null;
let skinToDelete = null;

const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

function openModal(type){
    closeModal();

    switch(type){
        case 'login':
            document.getElementById('loginModal').showModal();
            break;
        case 'register':
            document.getElementById('registerModal').showModal();
            break;
        case 'add':
            document.getElementById('addSkinModal').showModal();
            break;
        case 'edit':
            document.getElementById('editSkinModal').showModal();
            break;
        case 'confirm':
            document.getElementById('confirmModal').showModal();
            break; 
        default:
            console.log('Did not find modal-type', type);
    }
}

function closeModal(){
    const modals = document.querySelectorAll('dialog.modal-content');
    modals.forEach(modal => modal.close())
}

function setPageState(state){
    const unauthState = document.getElementById('unauthenticatedState');
    const skinsCont = document.getElementById('skinsContainer');
    const adminView = document.getElementById('adminView');
    const totalVal = document.getElementById('totalValueContainer');
    const statusMsg = document.getElementById('statusMessage');
    const adminUsersList = document.getElementById('adminUsersContainer');
    const adminInventory = document.getElementById('adminInventoryView');
    const adminCategories = document.getElementById('adminCategoriesView');
    const dashboardToolbar = document.getElementById('dashboardToolbar');

    if(unauthState) unauthState.classList.add('hidden');
    if(skinsCont) skinsCont.classList.add('hidden');
    if(adminView) adminView.classList.add('hidden');
    if(totalVal) totalVal.classList.add('hidden');
    if(statusMsg) statusMsg.classList.add('hidden'); 
    if(adminUsersList) adminUsersList.classList.add('hidden');
    if(adminInventory) adminInventory.classList.add('hidden');
    if(adminCategories) adminCategories.classList.add('hidden');
    if(dashboardToolbar) dashboardToolbar.classList.add('hidden');

    switch(state) {
        case 'loggedOut':
            if(unauthState) unauthState.classList.remove('hidden');
            break;
        case 'dashboard':
            if(skinsCont) skinsCont.classList.remove('hidden');
            if(totalVal) totalVal.classList.remove('hidden');
            if(dashboardToolbar) dashboardToolbar.classList.remove('hidden');
            break;
        case 'admin':
            if(adminView) adminView.classList.remove('hidden');
            if(adminUsersList) adminUsersList.classList.remove('hidden');
            if(adminCategories) adminCategories.classList.remove('hidden');
            break;
        case 'adminInventory':
            if(adminView) adminView.classList.remove('hidden');
            if(adminInventory) adminInventory.classList.remove('hidden');
            break;
        case 'loading':
            if(statusMsg) statusMsg.classList.remove('hidden');
            break;
        default:
            console.log('Unknown state given: ', state);
    }
}

function reloadCurrentView() {
    const adminInventory = document.getElementById('adminInventoryView')
    if(!adminInventory.classList.contains('hidden') && currentViewedUser){
        viewUserInventory(currentViewedUser.id, currentViewedUser.username)
    } else {
        fetchSkins()
    }
}

function showMessage(elementId, message, isError = true){
    const el = document.getElementById(elementId);
    el.textContent = message; 
    el.style.color = isError ? 'red' : 'green'; 
    el.classList.remove('hidden');
}

function updateAuthUI(isLoggedIn){
    const loginBtn = document.getElementById('headerLoginBtn');
    const regBtn = document.getElementById('headerRegisterBtn');
    const logoutBtn = document.getElementById('headerLogoutBtn');
    const adminBtn = document.getElementById('headerAdminBtn');
    const backBtn = document.getElementById('headerBackToDashboardBtn');

    const role = localStorage.getItem('userRole') || 'user';
    
    if(isLoggedIn){
        if(loginBtn) loginBtn.classList.add('hidden');
        if(regBtn) regBtn.classList.add('hidden');
        if(logoutBtn) logoutBtn.classList.remove('hidden');
        
        if(adminBtn) {
            if(role === 'admin') adminBtn.classList.remove('hidden');
            else adminBtn.classList.add('hidden');
        }
    } else {
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(regBtn) regBtn.classList.remove('hidden');
        if(logoutBtn) logoutBtn.classList.add('hidden');
        if(adminBtn) adminBtn.classList.add('hidden');
        if(backBtn) backBtn.classList.add('hidden');
    }
}

function editSkin(skin) {
    document.getElementById('editSkinId').value = skin.id;
    document.getElementById('editSkinName').value = skin.skin_name;
    document.getElementById('editSkinPrice').value = skin.price;
    document.getElementById('editSkinImage').value = skin.image_url || '';

    currentEditingSkin = skin; 

    openModal('edit');
}

function deleteSkin(skinId) {
    skinToDelete = skinId; 
    openModal('confirm');
}

function createUserCard(user){
    const userCard = document.createElement('article');
    userCard.classList.add('user-card');
    userCard.innerHTML = `
    <div> 
        <h4 style="margin: 0;">${user.username}</h4>
        <span style="font-size: 0.8em; color: #888;"> Role: ${user.role}</span>
    </div>
    <div style="display: flex; gap: 10px;">
        <button class="delete-user-btn btn btn-danger">Delete</button>
        <button class="view-inventory-btn btn btn-purple">View Inventory</button>
    </div>
    `;

    userCard.querySelector('.delete-user-btn').addEventListener('click', () => {
        if(confirm(`Are you sure you want to delete ${user.username} and all their skins?`)) {
            fetch(`/api/users/${user.id}`, { method: 'DELETE' })
            .then(res => {
                if(res.ok) {
                    loadAdminUsers();
                } else {
                    res.json().then(data => alert(data.error));
                }
            })
            .catch(err => console.log('Error deleting user:', err));
        }
    });

    userCard.querySelector('.view-inventory-btn').addEventListener('click', () => {
        viewUserInventory(user.id, user.username);
    });
    return userCard;
}

function loadAdminUsers() {
    const container = document.getElementById('adminUsersContainer');
    const statusMsg = document.getElementById('adminStatusMessage');

    container.innerHTML = '';
    statusMsg.textContent = 'Retrieving users...';
    statusMsg.style.color = '#ccc';
    statusMsg.classList.remove('hidden');

    fetch('/api/users')
        .then(response => {
            if(!response.ok) throw new Error('Network response was not OK!');
            return response.json();
        })
        .then(users => {
            container.innerHTML = '';
            if(users.length === 0){
                statusMsg.textContent = 'No users found in database.';
                return;
            }
            statusMsg.classList.add('hidden');
            users.forEach(user => {
                container.appendChild(createUserCard(user));
            });
        })
        .catch(error => {
            console.log('Error with retrieving users: ', error);
            showMessage('adminStatusMessage', 'Server error: Could not retrieve users', true);
        });
}

function viewUserInventory(userId, username){
    setPageState('adminInventory');
    currentViewedUser = { id: userId, username: username};

    const skinsContainer = document.getElementById('adminUserSkinsContainer');
    const title = document.getElementById('adminInventoryTitle');
    const statusMsg = document.getElementById('adminStatusMessage');

    title.textContent = `Viewing inventory for: ${username}`;
    skinsContainer.innerHTML = '';
    statusMsg.textContent = 'Retrieving skins...';
    statusMsg.style.color = '#ccc';
    statusMsg.classList.remove('hidden');

    fetch(`/api/users/${userId}/skins`)
    .then(response => {
        if(!response.ok) throw new Error('Network response was not OK!');
        return response.json();
    })
    .then(skins => {
        statusMsg.classList.add('hidden');
        if(skins.length === 0){
            skinsContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">This user has no items in their collection.</p>';
            return;
        }

        skins.forEach(skin => {
            skinsContainer.appendChild(createSkinCard(skin));
        });
    }).catch(error => {
        console.log('Error fetching user inventory:', error);
        showMessage('adminStatusMessage', 'Server error: Could not load user inventory', true);
    });
}

function createSkinCard(skin){
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
        <div class="skin-price flex-between" style="margin-top: 10px;">
            <span>${skin.price} kr</span>
            <div>
                <button class="edit-btn btn btn-primary btn-sm">Edit</button>                
                <button class="delete-btn btn btn-danger btn-sm" data-id="${skin.id}">Delete</button>
            </div>
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

    return article; 
}

function createAddSkinCard(){
    const addCard = document.createElement('article');
    addCard.classList.add('skin-card', 'add-skin-card');
    addCard.setAttribute('role', 'button'); 
    addCard.setAttribute('tabindex', '0');
    addCard.setAttribute('aria-label', 'Add new skin'); 

    addCard.innerHTML = `
        <div aria-hidden="true">
            <h3 style="font-size: 3em; margin: 0; line-height: 1;">+</h3>
            <p style="margin: 0; font-weight: bold;">Add Skin</p>
        </div> 
    `;
    addCard.addEventListener('click', () => {
        openModal('add');
    });
    return addCard;
}

function fetchSkins(){
    const container = document.getElementById('skinsContainer');
    const statusMessage = document.getElementById('statusMessage');
    const totalValueSpan = document.getElementById('totalValue'); 

    setPageState('loading');
    statusMessage.textContent = 'Retrieving data...';
    statusMessage.style.color = ''; // Återställ ifall det var rött tidigare

    fetch('/api/skins')
        .then(response => {
            if(response.status === 401){
                setPageState('loggedOut');
                updateAuthUI(false);
                throw new Error('NOT_LOGGED_IN'); 
            }

            if(!response.ok){
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(skins => {
            updateAuthUI(true);
            setPageState('dashboard');
        
            container.innerHTML = ''; 
            let totalValue = 0; 

            skins.forEach(skin => {
                totalValue += Number(skin.price);
                container.appendChild(createSkinCard(skin));
            });
            totalValueSpan.textContent = totalValue.toLocaleString('sv-SE'); 

            container.appendChild(createAddSkinCard());
            applyFiltersAndSort();
        })
        .catch(error =>{
            if(error.message !== 'NOT_LOGGED_IN'){
                console.log('Error with retrieving', error);
                setPageState('loading');
                showMessage('statusMessage', 'Server error: Could not retrieve your items', true);
            }
        });
}

function loadAdminCategories() {
    const list = document.getElementById('adminCategoryList');
    list.innerHTML = '<li style="color: #ccc;">Loading categories...</li>';

    fetch('/api/categories')
    .then(res => res.json())
    .then(categories => {
        list.innerHTML = '';
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.padding = '10px';
            li.style.background = '#1a1a1a';
            li.style.border = '1px solid #333';
            li.style.borderRadius = '4px';

            li.innerHTML = `
                <span>${cat.name}</span>
                ${cat.name !== 'Uncategorized' ? `<button class="delete-cat-btn" data-id="${cat.id}" style="background: #e74c3c; color: white; border: none; border-radius: 3px; padding: 4px 8px; cursor: pointer;">Delete</button>` : ''}
            `;

            const delBtn = li.querySelector('.delete-cat-btn');
            if(delBtn) {
                delBtn.addEventListener('click', () => {
                    if(confirm(`Are you sure you want to delete "${cat.name}"? Items will be moved to Uncategorized.`)) {
                        deleteCategory(cat.id);
                    }
                });
            }
            list.appendChild(li);
        });
    })
    .catch(err => console.log('Error fetching categories:', err));
}

function deleteCategory(id) {
    fetch(`/api/categories/${id}`, { method: 'DELETE' })
    .then(res => {
        if(res.ok) {
            loadAdminCategories();
            loadCategoriesToSelects();
        } else {
            res.json().then(data => alert(data.error));
        }
    });
}

function loadCategoriesToSelects() {
    fetch('/api/categories')
        .then(res => {
            if(!res.ok) throw new Error('Could not fetch categories');
            return res.json();
        })
        .then(categories => {
            const addSelect = document.getElementById('addSkinCategory');
            const editSelect = document.getElementById('editSkinCategory');
            const filterSelect = document.getElementById('filterCategory');
            
            addSelect.innerHTML = '';
            editSelect.innerHTML = '';
            filterSelect.innerHTML = '<option value="all">All Categories</option>';

            categories.forEach(cat => {
                if (cat.name !== 'Uncategorized') {
                    const optionHtml = `<option value="${cat.id}">${cat.name}</option>`;
                    addSelect.innerHTML += optionHtml;
                    editSelect.innerHTML += optionHtml;

                    const filterOption = `<option value="${cat.name.toLowerCase()}">${cat.name}</option>`;
                    filterSelect.innerHTML += filterOption;
                }
            });
        })
        .catch(err => console.log('Error updating category selects:', err));
}

function applyFiltersAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('filterCategory').value.toLowerCase();
    const sortValue = document.getElementById('sortSkins').value;
    const container = document.getElementById('skinsContainer');
    const cards = Array.from(container.querySelectorAll('.skin-card'));
    const addCard = cards.find(card => card.querySelector('h3') && card.querySelector('h3').textContent === '+');
    const skinCards = cards.filter(card => card !== addCard);

    skinCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const category = card.querySelector('.category').textContent.toLowerCase();
        const matchesSearch = name.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    if (sortValue !== 'default') {
        skinCards.sort((a, b) => {
            const priceTextA = a.querySelector('.skin-price span').textContent.replace(' kr', '').replace(/\s/g, '');
            const priceTextB = b.querySelector('.skin-price span').textContent.replace(' kr', '').replace(/\s/g, '');
            const priceA = Number(priceTextA);
            const priceB = Number(priceTextB);

            if (sortValue === 'price_asc') return priceA - priceB;
            if (sortValue === 'price_desc') return priceB - priceA;
            return 0;
        });
    }

    skinCards.forEach(card => container.appendChild(card));
    if (addCard) container.appendChild(addCard);
}

document.querySelectorAll('dialog.modal-content').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
        const dialogDimensions = dialog.getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            dialog.close();
        }
    });
});

document.getElementById('backToUserListBtn').addEventListener('click', () => {
    setPageState('admin');
});

document.getElementById('headerAdminBtn').addEventListener('click', () => {
    setPageState('admin');
    document.getElementById('headerAdminBtn').classList.add('hidden');
    document.getElementById('headerBackToDashboardBtn').classList.remove('hidden');
    loadAdminUsers();
    loadAdminCategories();
});

document.getElementById('headerBackToDashboardBtn').addEventListener('click', () => {
    setPageState('dashboard');
    document.getElementById('headerAdminBtn').classList.remove('hidden');
    document.getElementById('headerBackToDashboardBtn').classList.add('hidden');
    fetchSkins();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

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
            localStorage.setItem('userRole', res.body.role);
            fetchSkins(); // fetchSkins hanterar nu att sätta dashboard-vyn och uppdatera AuthUI!
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
    });
});

document.getElementById('closeEditModalBtn').addEventListener('click', () => {
    closeModal();
});

document.getElementById('headerLogoutBtn').addEventListener('click', (e) => {
    e.preventDefault(); 
    fetch('/api/logout', {
        method: 'POST'
    })
    .then(res => {
        if(res.ok){
            localStorage.removeItem('userRole');
            updateAuthUI(false);
            setPageState('loggedOut');

            document.getElementById('skinsContainer').innerHTML = '';
            document.getElementById('totalValue').textContent = '0';
        }
    }).catch(error => {
        console.log('Error while trying to log out', error); 
    });
});

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
            fetchSkins();
        } else {
            return res.json().then(data => {
                showMessage('addSkinMessage', data.error, true);
            });
        }
    })
    .catch(err => console.log('Error adding skin:', err)); 
});

document.getElementById('editSkinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editSkinId').value;
    const name = document.getElementById('editSkinName').value;
    const price = document.getElementById('editSkinPrice').value;
    const category_id = document.getElementById('editSkinCategory').value;
    const condition_id = document.getElementById('editSkinCondition').value;
    const image_url = document.getElementById('editSkinImage').value;
    
    const user_id = currentEditingSkin.user_id;

    fetch(`/api/skins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, category_id, condition_id, user_id, image_url })
    })
    .then(res => {
        if(res.ok) {
            closeModal();
            reloadCurrentView();
        } else {
            return res.json().then(data => {
                 showMessage('statusMessage', data.error || 'Could not update skin!', true);
                 setPageState('loading'); 
                 setTimeout(reloadCurrentView, 2000);
            });
        }
    })
    .catch(err => console.log('Error updating skin:', err));
});

document.getElementById('confirmNoBtn').addEventListener('click', () => {
    skinToDelete = null; 
    closeModal();
})

document.getElementById('confirmYesBtn').addEventListener('click', () => {
    if(!skinToDelete) return; 

    fetch(`/api/skins/${skinToDelete}`, {method: 'DELETE'})
    .then(res => {
        if(res.ok){
          closeModal();
            skinToDelete = null;
            reloadCurrentView();
        }else {
            closeModal();
           showMessage('statusMessage', 'Could not remove item!', true);
           setImmediate(reloadCurrentView, 2000);
        }
    })
    .catch(err => console.log('Error deleting skin: ', err));
})

document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();
    
    if(!name) return;

    fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
    .then(res => {
        if(res.ok) {
            nameInput.value = '';
            loadAdminCategories();
            loadCategoriesToSelects();
        } else {
            res.json().then(data => alert(data.error));
        }
    });
});

document.getElementById('headerLoginBtn').addEventListener('click',() => openModal('login'));
document.getElementById('textLoginLink').addEventListener('click', (e) => {e.preventDefault(); openModal('login');});
document.getElementById('headerRegisterBtn').addEventListener('click', () => openModal('register'));
document.getElementById('switchToRegister').addEventListener('click', (e) => {e.preventDefault(); openModal('register');});
document.getElementById('switchToLogin').addEventListener('click', (e) => {e.preventDefault(); openModal('login');});
document.getElementById('closeAddSkin').addEventListener('click', closeModal);

document.getElementById('closeLogin').addEventListener('click', closeModal);
document.getElementById('closeRegister').addEventListener('click', closeModal);

document.getElementById('searchInput').addEventListener('input', applyFiltersAndSort);
document.getElementById('filterCategory').addEventListener('change', applyFiltersAndSort);
document.getElementById('sortSkins').addEventListener('change', applyFiltersAndSort);

loadCategoriesToSelects();
