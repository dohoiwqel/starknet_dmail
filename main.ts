import { encoder } from "./encoder"
import { read } from "./utils/read";
import { ABI } from "./ABI";
import { Account, Contract, Provider, constants, ec, number, transaction, uint256 } from "starknet";
import { config } from "./config";

function getRandomInteger(data: number[]) {
    const [min, max] = data
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(sec: number) {
    console.log(`Спим ${sec} секунд`)
    return new Promise(resolve => setTimeout(() => resolve(''), sec*1000))
}

function generateRandomWord(length: number) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let randomWord = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      randomWord += alphabet[randomIndex];
    }
  
    return randomWord;
  }

async function waitForTransaction(tx: string, address: string) {
    try {
        const provider = new Provider({ sequencer: { network: 'mainnet-alpha' } })
        console.log(`хеш получен ${tx} | ${address}`)
        const res = await provider.waitForTransaction(tx, 1000)
        return true
    } catch(e: any) {
        console.log(e.response)
        return false
    }
}

async function main() {
    const provider = new Provider({ sequencer: { network: 'mainnet-alpha' } })

    const privates = await read('privates.txt')
    const addresses = await read('addresses.txt')

    for(let [i, privateKey] of privates.entries()) {
        const account = new Account(provider, addresses[i], ec.getKeyPair(privateKey));
        console.log(`Начинаем работу с аккаунтом ${account.address}`);
        (async() => {

            const contractAddress = '0x0454f0bd015e730e5adbb4f080b075fdbf55654ff41ee336203aa2e1ac4d4309'
            const contract = new Contract(ABI, contractAddress)        
            contract.connect(account)
        
            const email = encoder(`${generateRandomWord(config.mail_length)}@gmail.com`)
            const text = encoder(`${generateRandomWord(config.text_length)}`)
    
            try {
                const res = await contract.transaction(email, text)
                if(await waitForTransaction(res.transaction_hash, account.address)) console.log(`SUCCESS | tx: ${res.transaction_hash} | ${account.address}`);
            } catch(e) {
                console.log(`FAILED | ${e} | ${account.address}`)
            }
        })()
        await sleep(getRandomInteger(config.delay))
    }
}

main()