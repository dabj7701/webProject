document.addEventListener('DOMContentLoaded', fetchSkins); 

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
            if(!response.ok){
                throw new Error('Network response was not OK'); 
            }
            return response.json();
        })
        .then(skins => {
            console.log('GET response data:', skins)

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
            console.log('Error with retrieving', error);
            statusMessage.textContent ='Server error: Could not retrieve your items';
            statusMessage.classList.add('Error');
        });
}

