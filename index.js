const request = require('request-promise').defaults({gzip:true});
const fs = require('fs');
const req = require('request').defaults({gzip: true});
const cheerio = require('cheerio');
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true })

async function getTitles() {
    const result = await request.get("https://www.imdb.com/chart/top?ref_=nv_mv_250");
    const $ = await cheerio.load(result);
    const movies = $('tr').map((i, e) => {
        const title = $(e).find('td.titleColumn > a').text();
        let url ="https://imdb.com"+ $(e).find('td.titleColumn > a').attr('href');
        const rating = $(e).find('td.ratingColumn').children().first().text();
        if(title){
            return { title, rating, url, rank: i }
        }
     
    }).get()
    return movies;
}


async function getposterUrls(movies) {
    const moviesWithUrl = await  Promise.all(
        movies.map(async movie => {
        try {
                const html = await request.get(movie.url);
                const $ = await cheerio.load(html);
                movie.posterUrl ="https://imdb.com"+$('div.poster > a').attr('href');
                return movie;
        } catch (error) {
            console.log(error)
        }
      })
    );
    return moviesWithUrl
}

async function getPsoterImgUrl(movies) {
    
    for (let index = 0; index < movies.length; index++) {
       try {
            const posterImgUrl = await nightmare.goto(movies[index].posterUrl).evaluate(() => 
               $('#photo-container > div > div:nth-child(2) > div > div.pswp__scroll-wrap > div.pswp__container > div:nth-child(2) > div > img:nth-child(2)').attr('src'));
           movies[index].posterImgUrl = posterImgUrl;
           //console.log(movies[index].posterImgUrl);
            savePoster(movies[index]);
       }catch(e){
           console.log(e)
       }
    } 
    return  movies
}

async function savePoster(movie) {
    try {
        req.get(movie.posterImgUrl).pipe(fs.createWriteStream(`posters/${movie.rank}.png`))
    }catch(e){
        console.log(e)
    }
}

async function main() {
    let movies = await getTitles();
    movies = await getposterUrls(movies);
    movies = await getPsoterImgUrl(movies)
   
}

main()