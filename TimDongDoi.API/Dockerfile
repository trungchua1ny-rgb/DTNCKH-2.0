# Sử dụng môi trường runtime .NET 9.0 (hoặc đổi thành 8.0 tùy máy bạn)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Sử dụng SDK để build code
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Copy file csproj và restore thư viện
COPY ["TimDongDoi.API.csproj", "./"]
RUN dotnet restore "TimDongDoi.API.csproj"

# Copy toàn bộ code và build
COPY . .
RUN dotnet build "TimDongDoi.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TimDongDoi.API.csproj" -c Release -o /app/publish

# Copy file đã build sang môi trường chạy nhẹ hơn
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TimDongDoi.API.dll"]