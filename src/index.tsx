import * as React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 1, // 1 hour to retain cached data on an inactive query before removing it
        },
    },
})

// persists data to the client in localstorage
const persister = createSyncStoragePersister({
    storage: window.localStorage,
})

type Pokemon = {
    name: string,
    id: number
}

type PokemonMap = {
    data: {
        gen1_species: Array<Pokemon>
    }
}

function usePokemon() {
    return useQuery({
        queryKey: ['pokemon'],
        queryFn: async (): Promise<PokemonMap> => {
            const graphQlQuery = `
            {
                gen1_species: pokemon_v2_pokemonspecies(
                    where: { pokemon_v2_generation: { name: { _eq: "generation-i" } } }
                    order_by: { id: asc }
                ) {
                    name
                    id
                }
            }
            `

            const response = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
                method: 'post',
                body: JSON.stringify({
                    query: graphQlQuery
                })
            });
            let responseJSON = await response.json();
            console.log({ responseJSON });
            
            return responseJSON
        },
    })
}

function Pokemon() {
    const queryClient = useQueryClient()
    const { status, data, error, isFetching } = usePokemon()

    console.log({ data })
    return (
        <div>
            <h1>Pokemon</h1>
            <div>
                {status === 'pending' ? (
                    'Loading...'
                ) : status === 'error' ? (
                    <span>Error: {error.message}</span>
                ) : (
                    <>
                        <div>
                            {data?.data?.gen1_species.map((pokemon) => (
                                <p key={pokemon.id}>
                                    <span  style={
                                            // We can access the query data here to show bold links for
                                            // ones that are cached
                                            queryClient.getQueryData(['pokemon', pokemon.id])
                                                ? {
                                                    fontWeight: 'bold',
                                                    color: 'green',
                                                }
                                                : {}
                                        }>
                                            {``}
                                        </span>
                                    <a
                                        href="#"
                                       
                                    >
                                        {pokemon.name}

                                    </a>
                                </p>
                            ))}
                        </div>
                        <div>{isFetching ? 'Background Updating...' : ' '}</div>
                    </>
                )}
            </div>
        </div>
    )
}

function App() {

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            <p>
                As you visit the pokemon below, you will notice them in a loading state
                the first time you load them. However, after you return to this list and
                click on any pokemon you have already visited again, you will see them
                load instantly and background refresh right before your eyes!{' '}
                <strong>
                    (You may need to throttle your network speed to simulate longer
                    loading sequences)
                </strong>
            </p>
            <Pokemon />
            <ReactQueryDevtools initialIsOpen />
        </PersistQueryClientProvider>
    )
}

const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(<App />)
